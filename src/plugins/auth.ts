import { Elysia, t, type InferContext } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db";
import { verifyWithSalt } from "../utils/auth";

/* ────────────────────────────────────────────────────────────────
 *  Constants
 * ───────────────────────────────────────────────────────────── */
const REFRESH_EXP = `30d`; // 30-day session
const ACCESS_EXP = "10m"; // 10-minute bearer
const REFRESH_MAX_AGE_S = 30 * 24 * 60 * 60; // seconds
const ACCESS_MAX_AGE_S = 10 * 60; // 600 s

export type AuthPayload =
  | {
      /** ID of the staff member who owns this session */
      sub: string;
      /** Current role of the user – always "staff" in this variant */
      role: "staff";
      /** Incremented whenever the staff resets their pin/password */
      credVersion: number;
      /** Expiry timestamp – injected by @elysiajs/jwt */
      exp?: number;
    }
  | {
      /** ID of the staff member who owns this session */
      sub: string;
      /** Current role of the user – always "admin" in this variant */
      role: "admin";
      /** Admin account ID (separate table) */
      adminId: string;
      /** Max of staff/admin credVersion – forces re‑login on either reset */
      credVersion: number;
      /** Expiry timestamp (JWT standard claim) */
      exp?: number;
    };

/* Convenience wrapper so we can reference the union everywhere */
export type NullableAuth = { authPayload: AuthPayload | null };
export type ScopedAuth = { auth: AuthPayload };
/* ────────────────────────────────────────────────────────────────
 *  Token & Cookie Utilities
 * ───────────────────────────────────────────────────────────── */

/** Create base auth payload for staff */
const createStaffPayload = (staff: {
  id: string;
  credVersion: number;
}): Extract<AuthPayload, { role: "staff" }> => ({
  sub: staff.id,
  role: "staff",
  credVersion: staff.credVersion,
});

/** Create base auth payload for admin */
const createAdminPayload = (
  staff: { id: string; credVersion: number },
  admin: { id: string; credVersion: number }
): Extract<AuthPayload, { role: "admin" }> => ({
  sub: staff.id,
  role: "admin",
  adminId: admin.id,
  credVersion: Math.max(admin.credVersion, staff.credVersion),
});

/** Mint access and refresh tokens, set cookies */
const mintTokensAndSetCookies = async (
  payload: AuthPayload,
  context: {
    jwtAccess: { sign: (payload: any) => Promise<string> };
    jwtRefresh: { sign: (payload: any) => Promise<string> };
    cookie: InferContext<Elysia>["cookie"];
  }
): Promise<{ accessToken: string; refreshToken: string }> => {
  const { jwtAccess, jwtRefresh, cookie } = context;
  const accessToken = await jwtAccess.sign(payload);
  const refreshToken = await jwtRefresh.sign(payload);

  setAccessTokenCookie(cookie, accessToken);
  setRefreshTokenCookie(cookie, refreshToken);

  return { accessToken, refreshToken };
};

/** Set only access token cookie (for refresh scenarios) */
const setAccessTokenCookie = (
  cookie: InferContext<Elysia>["cookie"],
  token: string
): void => {
  cookie.access_token.set({
    value: token,
    maxAge: ACCESS_MAX_AGE_S,
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
};

/** Set refresh token cookie with custom httpOnly setting */
const setRefreshTokenCookie = (
  cookie: InferContext<Elysia>["cookie"],
  token: string
): void => {
  cookie.refresh_token.set({
    value: token,
    maxAge: REFRESH_MAX_AGE_S,
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
};

export const authedPlugin = new Elysia()
  /* ▼ JWT instances ----------------------------------------- */
  .use(
    jwt({
      name: "jwtRefresh",
      secret: DMNO_CONFIG.REFRESH_JWT_SECRET,
      exp: REFRESH_EXP,
    })
  )
  .use(
    jwt({
      name: "jwtAccess",
      secret: DMNO_CONFIG.ACCESS_JWT_SECRET,
      exp: ACCESS_EXP,
    })
  )

  /* ─────────────── Derive #1: parse/refresh tokens ────────── */
  .derive(
    { as: "scoped" },
    async ({ headers, cookie, jwtAccess, jwtRefresh }) => {
      let authPayload: AuthPayload | null = null;
      let newAccessToken: string | null = null;

      // ① Authorization header (`Bearer <token>`)
      const headerToken = headers["authorization"]?.split(" ")[1];
      if (headerToken) {
        const validatedHeaderToken = await jwtAccess
          .verify(headerToken)
          .catch(() => null);
        if (validatedHeaderToken) {
          authPayload = validatedHeaderToken as AuthPayload;
        }
      }

      const accessToken = cookie.access_token?.value;

      // ② Access-token cookie
      if (!authPayload && accessToken) {
        const validatedCookieToken = await jwtAccess
          .verify(accessToken)
          .catch(() => null);
        if (validatedCookieToken) {
          authPayload = validatedCookieToken as AuthPayload;
          newAccessToken = accessToken;
        }
      }

      const refreshToken = cookie.refresh_token?.value;

      // ③ Silent refresh via refresh-token cookie
      if (!authPayload && refreshToken) {
        const validatedRefreshToken = await jwtRefresh
          .verify(refreshToken)
          .catch((e) => {
            return false as const;
          });
        if (validatedRefreshToken) {
          // rotate refresh TTL + issue fresh access
          const newRefresh = await jwtRefresh.sign(validatedRefreshToken);
          setRefreshTokenCookie(cookie, newRefresh);

          // Take the refresh tokens payload, and issue a new access token
          const newAccess = await jwtAccess.sign(validatedRefreshToken);
          setAccessTokenCookie(cookie, newAccess);

          authPayload = validatedRefreshToken as AuthPayload;
          newAccessToken = newAccess;
        }
      }

      return { authPayload, newAccessToken }; // null ↔ unauthenticated
    }
  );

export const guardedRoutes = new Elysia()
  .use(authedPlugin)
  /* ─────────────── Derive #2: guard (protected) ───────────── */
  .derive(({ authPayload, set }) => {
    if (!authPayload) {
      set.status = 401;
      throw new Error("Unauthorized");
    }
    return { authPayload } as const;
  })
  /* ---------- zero-token: re-uses derive #1 ----------------- */
  .post("/zero-token", async ({ authPayload, newAccessToken, status }) => {
    if (!authPayload)
      return status(401, { success: false, message: "Invalid session" });

    return {
      success: true,
      token: newAccessToken,
      subject: authPayload.sub,
    };
  });

/* ────────────────────────────────────────────────────────────────
 *  Auth plugin (2-phase derive)
 * ───────────────────────────────────────────────────────────── */
export const unguardedRoutes = new Elysia()
  .use(authedPlugin)
  /* ─────────────── Public routes (login + zero-token) ────── */
  .group("/login", (app) =>
    app
      /* ----- staff-pin login ------------------------------- */
      .post(
        "/staff-pin",
        async ({ body, cookie, jwtRefresh, jwtAccess }) => {
          const { staffId, pin } = body;

          const staff = await db.staff.findUnique({
            where: { id: staffId },
            include: { adminAccount: true, pinLogin: true },
          });

          if (!staff || staff.disabledAt)
            return { success: false, message: "Invalid credentials" };

          const verificationResult = await verifyWithSalt(
            pin,
            staff.pinLogin.pinSalt,
            staff.pinLogin.pinHash
          );
          if (!verificationResult) {
            return { success: false, message: "Invalid credentials" };
          }

          const basePayload = createStaffPayload(staff);
          const { accessToken, refreshToken } = await mintTokensAndSetCookies(
            basePayload,
            { jwtAccess, jwtRefresh, cookie }
          );

          return {
            success: true,
            firstName: staff.firstName,
            lastName: staff.lastName,
            staffId: staff.id,
            role: "staff",
          } as const;
        },
        {
          body: t.Object({
            staffId: t.String(),
            pin: t.String(),
          }),
        }
      )

      /* ----- admin login ------------------------------------ */
      .post(
        "/admin",
        async ({
          body,
          cookie,
          jwtRefresh,
          jwtAccess,
          status,
          server,
          request,
        }) => {
          const { email, password } = body;

          const admin = await db.admin.findFirst({
            where: { email: email.toLowerCase() },
            include: { staff: true, passwordLogin: true },
          });

          if (
            !admin ||
            admin.disabledAt ||
            admin.staff.disabledAt ||
            !verifyWithSalt(
              password,
              admin.passwordLogin.passwordSalt,
              admin.passwordLogin.passwordHash
            )
          )
            return status(401, {
              success: false,
              message: "Invalid credentials",
            });

          const basePayload = createAdminPayload(admin.staff, admin);
          await mintTokensAndSetCookies(basePayload, {
            jwtAccess,
            jwtRefresh,
            cookie,
          });

          console.log(
            `Admin login ${admin.id} from ${server?.requestIP(request)}`
          );
          return {
            success: true,
            firstName: admin.staff.firstName,
            lastName: admin.staff.lastName,
            staffId: admin.staff.id,
            role: "admin",
            email: admin.email,
            adminId: admin.id,
          } as const;
        },
        {
          body: t.Object({
            email: t.String({ format: "email" }),
            password: t.String({ minLength: 8 }),
          }),
        }
      )
  )

  .get("/me", async ({ authPayload, cookie }) => {
    if (!authPayload) {
      return {
        success: true as const,
        isLoggedIn: false,
      };
    }
    /* auth comes from guard; look up user for UI */
    const staff = await db.staff.findUnique({
      where: { id: authPayload.sub },
      select: { firstName: true, lastName: true },
    });
    if (!staff) {
      cookie.refresh_token.remove();
      cookie.access_token.remove();
      return {
        success: false,
        isLoggedIn: false,
        message: "Staff not found",
      } as const;
    }
    let email: string | null = null;
    if (authPayload.role === "admin" && authPayload.adminId) {
      const admin = await db.admin.findUnique({
        where: { id: authPayload.adminId },
        select: { email: true },
      });
      email = admin?.email ?? null;
    }

    return {
      success: true as const,
      isLoggedIn: true,
      firstName: staff.firstName,
      lastName: staff.lastName,
      email,
      staffId: authPayload.sub,
      role: authPayload.role,
      adminId: authPayload.role === "admin" ? authPayload.adminId : null,
    } as const;
  })
  /* ─────── all routes below this point require auth ───────── */

  .post("/logout", async ({ cookie, authPayload, server, request }) => {
    if (authPayload)
      console.log(
        `Logout ${authPayload.sub} from ${server?.requestIP(request)}`
      );
    cookie.refresh_token.remove();
    cookie.access_token.remove();
    return { success: true } as const;
  });

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(guardedRoutes)
  .use(unguardedRoutes);
