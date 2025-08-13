import { Elysia, t, type InferContext } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db";
import { verifyWithSalt } from "../utils/auth";

/* ────────────────────────────────────────────────────────────────
 *  Constants
 * ───────────────────────────────────────────────────────────── */
const REFRESH_TTL_DAYS = DMNO_CONFIG.REFRESH_TTL_DAYS ?? 30;
const REFRESH_EXP = `${REFRESH_TTL_DAYS}d`; // 30-day session
const ACCESS_EXP = "10m"; // 10-minute bearer
const REFRESH_MAX_AGE_S = REFRESH_TTL_DAYS * 24 * 60 * 60; // seconds
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
 *  Helper: set access token cookie
 * ───────────────────────────────────────────────────────────── */
const setAccessCookie = (
  cookie: InferContext<Elysia>["cookie"],
  token: string
) =>
  cookie.access_token.set({
    value: token,
    maxAge: ACCESS_MAX_AGE_S,
    httpOnly: false, // SPA may read & send via header
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

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

      const cookieToken = cookie.access_token?.value;

      // ② Access-token cookie
      if (!authPayload && cookieToken) {
        const validatedCookieToken = await jwtAccess
          .verify(cookieToken)
          .catch(() => null);
        if (validatedCookieToken) {
          authPayload = validatedCookieToken as AuthPayload;
        }
      }

      const refreshToken = cookie.refresh_token?.value;

      // ③ Silent refresh via refresh-token cookie
      if (!authPayload && refreshToken) {
        const validatedRefreshToken = await jwtRefresh
          .verify(refreshToken)
          .catch(() => null);
        if (validatedRefreshToken) {
          // rotate refresh TTL + issue fresh access
          cookie.refresh_token.value = await jwtRefresh.sign(
            validatedRefreshToken
          );
          const newAccess = await jwtAccess.sign(validatedRefreshToken);
          setAccessCookie(cookie, newAccess);
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
  .post(
    "/zero-token",
    async ({ cookie, jwtRefresh, jwtAccess, authPayload, status }) => {
      if (!authPayload)
        return status(401, { success: false, message: "Invalid session" });

      // rotate refresh & fresh access
      cookie.refresh_token.value = await jwtRefresh.sign(authPayload);
      const newAccess = await jwtAccess.sign(authPayload);
      setAccessCookie(cookie, newAccess);

      const newPayloadBase = {
        sub: authPayload.sub,
        iss: "rowm-auth",
        aud: "zero-cache",
        exp: "5m",
      };

      const zeroToken = await jwtAccess.sign(
        authPayload.role === "admin"
          ? {
              ...newPayloadBase,
              adminId: authPayload.adminId,
            }
          : newPayloadBase
      );

      return {
        success: true,
        token: zeroToken,
        subject: authPayload.sub,
      };
    }
  );

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
        async ({
          body,
          cookie,
          jwtRefresh,
          jwtAccess,
          status,
          server,
          request,
        }) => {
          const { staffId, pin } = body;

          const staff = await db.staff.findUnique({
            where: { id: staffId },
            include: { adminAccount: true },
          });

          if (
            !staff ||
            staff.disabledAt ||
            !verifyWithSalt(pin, staff.pinSalt, staff.pinHash)
          )
            return status(401, {
              success: false,
              message: "Invalid credentials",
            });

          const basePayload = {
            sub: staff.id,
            role: staff.adminAccount ? ("admin" as const) : ("staff" as const),
            credVersion: staff.credVersion,
          } as const;

          const refreshToken = await jwtRefresh.sign(basePayload);
          const accessToken = await jwtAccess.sign(basePayload);

          cookie.refresh_token.set({
            value: refreshToken,
            maxAge: REFRESH_MAX_AGE_S,
            httpOnly: true,
            sameSite: "strict",
            path: "/",
            secure: process.env.NODE_ENV === "production",
          });
          setAccessCookie(cookie, accessToken);

          console.log(
            `Staff login ${staff.id} from ${server?.requestIP(request)}`
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
            pin: t.String({ pattern: "^\\d{6}$" }),
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
            include: { staff: true },
          });

          if (
            !admin ||
            admin.disabledAt ||
            admin.staff.disabledAt ||
            !verifyWithSalt(password, admin.passwordSalt, admin.passwordHash)
          )
            return status(401, {
              success: false,
              message: "Invalid credentials",
            });

          const basePayload = {
            sub: admin.staff.id,
            role: "admin" as const,
            adminId: admin.id,
            credVersion: Math.max(admin.credVersion, admin.staff.credVersion),
          } as const;

          const refreshToken = await jwtRefresh.sign(basePayload);
          const accessToken = await jwtAccess.sign(basePayload);

          cookie.refresh_token.set({
            value: refreshToken,
            maxAge: REFRESH_MAX_AGE_S,
            httpOnly: true,
            sameSite: "strict",
            path: "/",
            secure: process.env.NODE_ENV === "production",
          });
          setAccessCookie(cookie, accessToken);

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

  .get("/me", async ({ authPayload }) => {
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
    if (!staff) return { success: false, message: "Staff not found" } as const;

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
