import { jwt } from "@elysiajs/jwt";
import { Elysia, type InferContext, t } from "elysia";
import { nanoid } from "nanoid";
import { verifyWithSalt } from "../utils/auth";
import {
  createOAuthCredential,
  createPrincipal,
  createRoleGrant,
  findOAuthCredential,
  findPasswordCredentialByEmail,
  findPinCredentialByCode,
  findPinCredentialWithHash,
  findPrincipalById,
  findRoleGrantForScope,
  findRoleGrantsForPrincipal,
  sql,
  updateOAuthCredentialLastUsed,
} from "../utils/db";
import { tenantPlugin } from "./tenant";

const generatePrincipalId = () => `prin_${nanoid(16)}`;
const generateCredentialId = () => `cred_${nanoid(16)}`;
const generateRoleGrantId = () => `rg_${nanoid(16)}`;

// OAuth config
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID ?? "";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET ?? "";
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3000";
const PLATFORM_URL = process.env.PLATFORM_URL ?? "http://localhost:3001";

/* ────────────────────────────────────────────────────────────────
 *  Constants
 * ───────────────────────────────────────────────────────────── */
const REFRESH_EXP = `30d`; // 30-day session
const ACCESS_EXP = "10m"; // 10-minute bearer
const REFRESH_MAX_AGE_S = 30 * 24 * 60 * 60; // seconds
const ACCESS_MAX_AGE_S = 10 * 60; // 600 s

/**
 * Auth payload stored in JWT - Unified Principal-based model
 *
 * All authentication flows produce the same payload structure:
 * - sub: User identity (tenantId:principalId for tenant scope, principalId for platform)
 * - scopeKind: "tenant" | "platform" (where they're acting)
 * - tenantId: Present for tenant scope, null for platform
 * - role: The role granted in this scope
 * - credVersion: For session invalidation
 */
export type AuthPayload = {
  /** User identity - format: tenantId:principalId (tenant) or principalId (platform) */
  sub: string;
  /** Scope kind - where this session is valid */
  scopeKind: "tenant" | "platform";
  /** Tenant ID - present for tenant scope, undefined for platform */
  tenantId?: string;
  /** Role in this scope */
  role: string;
  /** Display name for UI */
  displayName: string;
  /** Email if available (from password or OAuth credential) */
  email?: string;
  /** Global cred version - for session invalidation */
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

/** Create auth payload for tenant-scoped PIN login */
const createTenantPayload = (data: {
  principalId: string;
  tenantId: string;
  role: string;
  displayName: string;
  credVersion: number;
}): AuthPayload => ({
  sub: `${data.tenantId}:${data.principalId}`,
  scopeKind: "tenant",
  tenantId: data.tenantId,
  role: data.role,
  displayName: data.displayName,
  credVersion: data.credVersion,
});

/** Create auth payload for global password login (with scope selection) */
const createGlobalPayload = (data: {
  principalId: string;
  scopeKind: "tenant" | "platform";
  tenantId?: string;
  role: string;
  displayName: string;
  email: string;
  credVersion: number;
}): AuthPayload => ({
  sub: data.scopeKind === "tenant" && data.tenantId
    ? `${data.tenantId}:${data.principalId}`
    : data.principalId,
  scopeKind: data.scopeKind,
  tenantId: data.tenantId,
  role: data.role,
  displayName: data.displayName,
  email: data.email,
  credVersion: data.credVersion,
});

/** Mint access and refresh tokens, set cookies */
export const mintTokensAndSetCookies = async (
  payload: AuthPayload,
  context: {
    jwtAccess: { sign: (payload: AuthPayload) => Promise<string> };
    jwtRefresh: { sign: (payload: AuthPayload) => Promise<string> };
    cookie: InferContext<Elysia>["cookie"];
  },
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
  token: string,
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
  token: string,
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

export const authedPlugin = new Elysia({ name: "authedPlugin" })
  /* ▼ JWT instances ----------------------------------------- */
  .use(
    jwt({
      name: "jwtRefresh",
      secret: DMNO_CONFIG.REFRESH_JWT_SECRET,
      exp: REFRESH_EXP,
    }),
  )
  .use(
    jwt({
      name: "jwtAccess",
      secret: DMNO_CONFIG.ACCESS_JWT_SECRET,
      exp: ACCESS_EXP,
    }),
  )

  /* ─────────────── Derive #1: parse/refresh tokens ────────── */
  .derive(
    { as: "scoped" },
    async ({ headers, cookie, jwtAccess, jwtRefresh }) => {
      let authPayload: AuthPayload | null = null;
      let newAccessToken: string | null = null;

      // ① Authorization header (`Bearer <token>`)
      const headerToken = headers.authorization?.split(" ")[1];
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
      if (!authPayload && typeof accessToken === "string") {
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
      if (!authPayload && typeof refreshToken === "string") {
        const validatedRefreshToken = await jwtRefresh
          .verify(refreshToken)
          .catch(() => {
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
    },
  );

export const guardedRoutes = new Elysia({ name: "guardedRoutes" })
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
export const unguardedRoutes = new Elysia({ name: "unguardedRoutes" })
  .use(authedPlugin)
  .use(tenantPlugin)
  /* ─────────────── Public routes (login + zero-token) ────── */
  .group("/login", (app) =>
    app
      /* ----- PIN credential lookup by code (for UI) --------- */
      .post(
        "/staff-lookup",
        async ({ body, tenant, status }) => {
          if (!tenant.tenantId) {
            return status(400, {
              success: false,
              message: "Tenant context required",
            });
          }

          const { staffCode } = body;
          const credential = await findPinCredentialByCode(
            tenant.tenantId,
            staffCode,
          );

          if (!credential) {
            return {
              success: false,
              message: "Staff not found",
            } as const;
          }

          return {
            success: true,
            principalId: credential.principalId,
            staffCode: credential.staffCode,
            displayName: credential.displayName,
          } as const;
        },
        {
          body: t.Object({
            staffCode: t.String({ minLength: 3, maxLength: 3 }),
          }),
        },
      )

      /* ----- PIN login (tenant-scoped) ---------------------- */
      .post(
        "/staff-pin",
        async ({ body, tenant, cookie, jwtRefresh, jwtAccess, status }) => {
          if (!tenant.tenantId) {
            return status(400, {
              success: false,
              message: "Tenant context required",
            });
          }

          const { staffCode, pin } = body;

          // Find PIN credential with principal info
          const credential = await findPinCredentialWithHash(
            tenant.tenantId,
            staffCode,
          );

          if (!credential) {
            return { success: false, message: "Invalid credentials" };
          }

          // Verify PIN
          const valid = await verifyWithSalt(
            pin,
            credential.pinSalt,
            credential.pinHash,
          );
          if (!valid) {
            return { success: false, message: "Invalid credentials" };
          }

          // Find role grant for this tenant
          const roleGrant = await findRoleGrantForScope(
            credential.principalId,
            "tenant",
            tenant.tenantId,
          );

          if (!roleGrant) {
            return { success: false, message: "No access to this tenant" };
          }

          // Create JWT payload
          const payload = createTenantPayload({
            principalId: credential.principalId,
            tenantId: tenant.tenantId,
            role: roleGrant.role,
            displayName: credential.displayName,
            credVersion: credential.globalCredVersion,
          });
          await mintTokensAndSetCookies(payload, {
            jwtAccess,
            jwtRefresh,
            cookie,
          });

          return {
            success: true,
            principalId: credential.principalId,
            displayName: credential.displayName,
            staffCode: credential.staffCode,
            tenantId: tenant.tenantId,
            role: roleGrant.role,
          } as const;
        },
        {
          body: t.Object({
            staffCode: t.String({ minLength: 3, maxLength: 3 }),
            pin: t.String({ minLength: 4, maxLength: 6 }),
          }),
        },
      )

      /* ----- Email/password login (global) ------------------ */
      .post(
        "/email",
        async ({
          body,
          tenant,
          cookie,
          jwtRefresh,
          jwtAccess,
          status,
          server,
          request,
        }) => {
          const { email, password, tenantId: requestedTenantId } = body;

          // Find password credential by email (global lookup)
          const credential = await findPasswordCredentialByEmail(email);

          if (!credential) {
            return status(401, {
              success: false,
              message: "Invalid credentials",
            });
          }

          // Verify password
          const valid = await verifyWithSalt(
            password,
            credential.passwordSalt,
            credential.passwordHash,
          );
          if (!valid) {
            return status(401, {
              success: false,
              message: "Invalid credentials",
            });
          }

          // Get all role grants for this principal
          const roleGrants = await findRoleGrantsForPrincipal(
            credential.principalId,
          );

          if (roleGrants.length === 0) {
            return status(401, { success: false, message: "No active roles" });
          }

          // Determine scope: use requested tenant, current tenant context, or first available
          const effectiveTenantId = requestedTenantId || tenant.tenantId;
          let selectedGrant = roleGrants[0];

          if (effectiveTenantId) {
            // Look for a grant matching the tenant
            const tenantGrant = roleGrants.find(
              (g) =>
                g.scopeKind === "tenant" && g.tenantId === effectiveTenantId,
            );
            if (tenantGrant) {
              selectedGrant = tenantGrant;
            }
          }

          // Create JWT payload
          const payload = createGlobalPayload({
            principalId: credential.principalId,
            scopeKind: selectedGrant.scopeKind as "tenant" | "platform",
            tenantId: selectedGrant.tenantId ?? undefined,
            role: selectedGrant.role,
            displayName: credential.displayName,
            email: credential.email,
            credVersion: credential.globalCredVersion,
          });
          await mintTokensAndSetCookies(payload, {
            jwtAccess,
            jwtRefresh,
            cookie,
          });

          console.log(
            `Email login ${credential.principalId} from ${server?.requestIP(request)}`,
          );

          return {
            success: true,
            principalId: credential.principalId,
            displayName: credential.displayName,
            email: credential.email,
            scopeKind: selectedGrant.scopeKind,
            tenantId: selectedGrant.tenantId,
            role: selectedGrant.role,
            availableGrants: roleGrants.map((g) => ({
              id: g.id,
              scopeKind: g.scopeKind,
              tenantId: g.tenantId,
              role: g.role,
            })),
          } as const;
        },
        {
          body: t.Object({
            email: t.String({ format: "email" }),
            password: t.String({ minLength: 8 }),
            tenantId: t.Optional(t.String()),
          }),
        },
      ),
  )

  .get("/me", async ({ authPayload, tenant, cookie, jwtAccess }) => {
    if (!authPayload) {
      // Not logged in - check if we have tenant context for anonymous access
      // Issue anonymous tenant token for Zero queries
      // Build userID in same format as frontend: tenantId:anon
      const anonUserID = tenant.tenantId ? `${tenant.tenantId}:anon` : "anon";
      const anonPayload: AuthPayload = {
        sub: anonUserID,
        scopeKind: "tenant",
        tenantId: tenant.tenantId ?? undefined,
        role: "anon",
        displayName: "Anonymous",
        credVersion: 0,
      };
      const anonToken = await jwtAccess.sign(anonPayload);

      return {
        success: true as const,
        isLoggedIn: false,
        // Provide tenant context for anonymous users
        tenantId: tenant.tenantId,
        tenantName: tenant.tenantName,
        anonToken, // Token for Zero queries
      };
    }

    // Verify principal still exists
    // Extract principalId from sub (format: tenantId:principalId for tenant, or just principalId for platform)
    const principalId = authPayload.scopeKind === "tenant" && authPayload.tenantId
      ? authPayload.sub.replace(`${authPayload.tenantId}:`, "")
      : authPayload.sub;
    const principal = await findPrincipalById(principalId);
    if (!principal) {
      cookie.refresh_token.remove();
      cookie.access_token.remove();
      return {
        success: false,
        isLoggedIn: false,
        message: "Principal not found",
      } as const;
    }

    // Get current role grants
    const roleGrants = await findRoleGrantsForPrincipal(principalId);

    return {
      success: true as const,
      isLoggedIn: true,
      principalId,
      displayName: authPayload.displayName,
      email: authPayload.email,
      scopeKind: authPayload.scopeKind,
      tenantId: authPayload.tenantId,
      role: authPayload.role,
      avatarUrl: principal.avatarUrl,
      availableGrants: roleGrants.map((g) => ({
        id: g.id,
        scopeKind: g.scopeKind,
        tenantId: g.tenantId,
        role: g.role,
      })),
    } as const;
  })

  .post("/logout", async ({ cookie, authPayload, server, request }) => {
    if (authPayload) {
      console.log(
        `Logout ${authPayload.sub} from ${server?.requestIP(request)}`,
      );
    }
    cookie.refresh_token.remove();
    cookie.access_token.remove();
    return { success: true } as const;
  });

/* ────────────────────────────────────────────────────────────────
 *  OAuth Routes (generic - resolves identity based on context)
 * ───────────────────────────────────────────────────────────── */
const oauthRoutes = new Elysia({ name: "oauthRoutes" })
  .use(authedPlugin)
  .group("/oauth", (app) =>
    app
      // Google OAuth redirect
      .get("/google", async ({ redirect }) => {
        const redirectUri = `${BACKEND_URL}/auth/oauth/google/callback`;
        const params = new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          redirect_uri: redirectUri,
          response_type: "code",
          scope: "openid email profile",
          access_type: "offline",
          prompt: "consent",
        });
        return redirect(
          `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
        );
      })

      // Google OAuth callback
      .get(
        "/google/callback",
        async ({ query, cookie, jwtAccess, jwtRefresh, redirect }) => {
          const { code, error } = query;
          if (error || !code) {
            return redirect(`${PLATFORM_URL}/login?error=oauth_failed`);
          }

          try {
            // Exchange code for tokens
            const tokenRes = await fetch(
              "https://oauth2.googleapis.com/token",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                  code,
                  client_id: GOOGLE_CLIENT_ID,
                  client_secret: GOOGLE_CLIENT_SECRET,
                  redirect_uri: `${BACKEND_URL}/auth/oauth/google/callback`,
                  grant_type: "authorization_code",
                }),
              },
            );

            if (!tokenRes.ok) throw new Error("Failed to exchange code");
            const tokens = await tokenRes.json();

            // Get user info
            const userRes = await fetch(
              "https://www.googleapis.com/oauth2/v2/userinfo",
              {
                headers: { Authorization: `Bearer ${tokens.access_token}` },
              },
            );
            if (!userRes.ok) throw new Error("Failed to get user info");

            const userInfo = await userRes.json();
            const { id: googleId, email, name, picture } = userInfo;

            // Find existing OAuth credential or create new principal
            let oauthCred = await findOAuthCredential("google", googleId);

            if (!oauthCred) {
              // Create new principal + OAuth credential + platform role grant
              const principalId = generatePrincipalId();
              const credentialId = generateCredentialId();
              const roleGrantId = generateRoleGrantId();

              await createPrincipal({
                id: principalId,
                kind: "human",
                displayName: name || email,
                avatarUrl: picture,
              });

              await createOAuthCredential({
                id: credentialId,
                principalId,
                provider: "google",
                providerId: googleId,
                email,
              });

              await createRoleGrant({
                id: roleGrantId,
                principalId,
                scopeKind: "platform",
                role: "platform",
              });

              oauthCred = await findOAuthCredential("google", googleId);
            }

            if (!oauthCred) {
              return redirect(`${PLATFORM_URL}/login?error=oauth_failed`);
            }

            await updateOAuthCredentialLastUsed(oauthCred.id);

            // Get role grants for this principal
            const roleGrants = await findRoleGrantsForPrincipal(
              oauthCred.principalId,
            );
            const platformGrant = roleGrants.find(
              (g) => g.scopeKind === "platform",
            );

            if (!platformGrant) {
              return redirect(`${PLATFORM_URL}/login?error=unauthorized`);
            }

            // Create payload and mint tokens
            const payload = createGlobalPayload({
              principalId: oauthCred.principalId,
              scopeKind: "platform",
              role: platformGrant.role,
              displayName: oauthCred.displayName,
              email: oauthCred.email || email,
              credVersion: oauthCred.globalCredVersion,
            });
            await mintTokensAndSetCookies(payload, {
              jwtAccess,
              jwtRefresh,
              cookie,
            });

            return redirect(PLATFORM_URL);
          } catch (err) {
            console.error("Google OAuth error:", err);
            return redirect(`${PLATFORM_URL}/login?error=oauth_failed`);
          }
        },
        {
          query: t.Object({
            code: t.Optional(t.String()),
            error: t.Optional(t.String()),
          }),
        },
      )

      // GitHub OAuth redirect
      .get("/github", async ({ redirect }) => {
        const redirectUri = `${BACKEND_URL}/auth/oauth/github/callback`;
        const params = new URLSearchParams({
          client_id: GITHUB_CLIENT_ID,
          redirect_uri: redirectUri,
          scope: "user:email",
        });
        return redirect(`https://github.com/login/oauth/authorize?${params}`);
      })

      // GitHub OAuth callback
      .get(
        "/github/callback",
        async ({ query, cookie, jwtAccess, jwtRefresh, redirect }) => {
          const { code, error } = query;
          if (error || !code) {
            return redirect(`${PLATFORM_URL}/login?error=oauth_failed`);
          }

          try {
            // Exchange code for access token
            const tokenRes = await fetch(
              "https://github.com/login/oauth/access_token",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
                body: JSON.stringify({
                  client_id: GITHUB_CLIENT_ID,
                  client_secret: GITHUB_CLIENT_SECRET,
                  code,
                  redirect_uri: `${BACKEND_URL}/auth/oauth/github/callback`,
                }),
              },
            );

            if (!tokenRes.ok) throw new Error("Failed to exchange code");
            const tokens = await tokenRes.json();

            // Get user info
            const userRes = await fetch("https://api.github.com/user", {
              headers: {
                Authorization: `Bearer ${tokens.access_token}`,
                Accept: "application/json",
              },
            });
            if (!userRes.ok) throw new Error("Failed to get user info");

            const userInfo = await userRes.json();

            // Get primary email
            const emailsRes = await fetch(
              "https://api.github.com/user/emails",
              {
                headers: {
                  Authorization: `Bearer ${tokens.access_token}`,
                  Accept: "application/json",
                },
              },
            );
            const emails: Array<{ email: string; primary?: boolean }> =
              await emailsRes.json();
            const primaryEmail =
              emails.find((e) => e.primary)?.email || userInfo.email;

            const { id: githubId, name, avatar_url } = userInfo;

            // Find existing OAuth credential or create new principal
            let oauthCred = await findOAuthCredential(
              "github",
              String(githubId),
            );

            if (!oauthCred) {
              // Create new principal + OAuth credential + platform role grant
              const principalId = generatePrincipalId();
              const credentialId = generateCredentialId();
              const roleGrantId = generateRoleGrantId();

              await createPrincipal({
                id: principalId,
                kind: "human",
                displayName: name || userInfo.login,
                avatarUrl: avatar_url,
              });

              await createOAuthCredential({
                id: credentialId,
                principalId,
                provider: "github",
                providerId: String(githubId),
                email: primaryEmail,
              });

              await createRoleGrant({
                id: roleGrantId,
                principalId,
                scopeKind: "platform",
                role: "platform",
              });

              oauthCred = await findOAuthCredential("github", String(githubId));
            }

            if (!oauthCred) {
              return redirect(`${PLATFORM_URL}/login?error=oauth_failed`);
            }

            await updateOAuthCredentialLastUsed(oauthCred.id);

            // Get role grants for this principal
            const roleGrants = await findRoleGrantsForPrincipal(
              oauthCred.principalId,
            );
            const platformGrant = roleGrants.find(
              (g) => g.scopeKind === "platform",
            );

            if (!platformGrant) {
              return redirect(`${PLATFORM_URL}/login?error=unauthorized`);
            }

            // Create payload and mint tokens
            const payload = createGlobalPayload({
              principalId: oauthCred.principalId,
              scopeKind: "platform",
              role: platformGrant.role,
              displayName: oauthCred.displayName,
              email: oauthCred.email || primaryEmail,
              credVersion: oauthCred.globalCredVersion,
            });
            await mintTokensAndSetCookies(payload, {
              jwtAccess,
              jwtRefresh,
              cookie,
            });

            return redirect(PLATFORM_URL);
          } catch (err) {
            console.error("GitHub OAuth error:", err);
            return redirect(`${PLATFORM_URL}/login?error=oauth_failed`);
          }
        },
        {
          query: t.Object({
            code: t.Optional(t.String()),
            error: t.Optional(t.String()),
          }),
        },
      ),
  );

/* ────────────────────────────────────────────────────────────────
 *  Platform-specific routes (impersonation, etc.)
 * ───────────────────────────────────────────────────────────── */
const platformRoutes = new Elysia({ name: "platformRoutes" })
  .use(authedPlugin)
  .group("/platform", (app) =>
    app.post(
      "/impersonate/:tenantId",
      async ({ params, authPayload, jwtAccess, set }) => {
        if (!authPayload || authPayload.role !== "platform") {
          set.status = 401;
          return { error: "Unauthorized - platform admin required" };
        }

        const { tenantId } = params;

        // Verify tenant exists
        const tenantRows = (await sql`
            SELECT id, name FROM tenant WHERE id = ${tenantId} LIMIT 1
          `) as Array<{ id: string; name: string }>;

        if (tenantRows.length === 0) {
          set.status = 404;
          return { error: "Tenant not found" };
        }

        // Generate signed impersonation token
        const token = await jwtAccess.sign({
          type: "platform_impersonation",
          platformAdminId: authPayload.sub,
          tenantId,
          role: "platform",
          exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
        });

        return { token };
      },
      {
        params: t.Object({ tenantId: t.String() }),
      },
    ),
  );

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(guardedRoutes)
  .use(unguardedRoutes)
  .use(oauthRoutes)
  .use(platformRoutes);
