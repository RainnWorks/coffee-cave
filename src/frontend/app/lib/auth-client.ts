import { client } from "@/client";

/* ─────────────────────────────────────────────── errors ── */

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly retryAfter?: number,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/* ─────────────────────────────────────────────── types ── */

export interface RoleGrant {
  id: string;
  scopeKind: "tenant" | "platform";
  tenantId: string | null;
  role: string;
}

export interface StaffLookupResult {
  success: true;
  principalId: string;
  staffCode: string;
  displayName: string;
}

export interface PinLoginResult {
  success: true;
  principalId: string;
  displayName: string;
  staffCode: string;
  tenantId: string;
  role: string;
}

export interface EmailLoginResult {
  success: true;
  principalId: string;
  displayName: string;
  email: string;
  scopeKind: "tenant" | "platform";
  tenantId: string | null;
  role: string;
  availableGrants: RoleGrant[];
}

export interface MeResult {
  success: true;
  isLoggedIn: true;
  principalId: string;
  displayName: string;
  email?: string;
  scopeKind: "tenant" | "platform";
  tenantId?: string;
  role: string;
  avatarUrl?: string | null;
  availableGrants: RoleGrant[];
}

/* ─────────────────────────────────────── unified auth client ── */

export interface AuthClientOptions {
  baseUrl?: string;
  /** Router mode - affects which endpoints are available */
  mode?: "tenant" | "platform";
  /** Tenant ID - required for tenant mode in dev */
  tenantSlug?: string | null;
}

/**
 * Get headers for dev mode routing
 */
function getDevHeaders(options: AuthClientOptions): Record<string, string> {
  const headers: Record<string, string> = {};

  // Only add dev headers in development
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
  ) {
    if (options.mode) {
      headers["X-Dev-Router-Mode"] = options.mode;
    }
    if (options.tenantSlug) {
      headers["X-Dev-Tenant-Slug"] = options.tenantSlug;
    }
  }

  return headers;
}

/**
 * Unified auth client for all roles (staff, admin, platform)
 *
 * All methods are available regardless of user role:
 * - Tenant methods: lookupStaffByCode, loginWithStaffPin, loginWithAdminCredentials
 * - Platform methods: loginWithGoogle, loginWithGitHub, getImpersonationToken
 * - Shared methods: me, getAccessToken, logout
 */
export const createAuthClient = (options: AuthClientOptions | string = "") => {
  // Handle legacy string argument
  const opts: AuthClientOptions =
    typeof options === "string" ? { baseUrl: options } : options;
  const baseUrl = opts.baseUrl || "";
  const api = client(baseUrl);
  const devHeaders = getDevHeaders(opts);

  return {
    /* ─────────────────────────────────────────────────────────
     * Shared methods (work for all roles)
     * ───────────────────────────────────────────────────────── */

    /** Get current authenticated user info (works for all roles) */
    async me() {
      return api.auth.me.get({
        fetch: { credentials: "include", headers: devHeaders },
      });
    },

    /** Get Zero access token (works for all roles) */
    async getAccessToken(): Promise<string | undefined> {
      const res = await api.auth["zero-token"].post(undefined, {
        fetch: { credentials: "include", headers: devHeaders },
      });
      return res.data?.token ?? undefined;
    },

    /** Logout and optionally purge local databases (works for all roles) */
    async logout(dropDatabases = true): Promise<void> {
      await api.auth.logout.post(undefined, {
        fetch: { credentials: "include", headers: devHeaders },
      });
      if (dropDatabases && typeof window !== "undefined") {
        try {
          const { dropAllDatabases } = await import("@rocicorp/zero");
          await dropAllDatabases();
        } catch (err) {
          console.warn("Could not drop Zero databases:", err);
        }
      }
    },

    /* ─────────────────────────────────────────────────────────
     * Tenant auth methods (PIN/password login)
     * ───────────────────────────────────────────────────────── */

    /** Look up staff by code (for showing name before PIN entry) */
    async lookupStaffByCode(staffCode: string) {
      const res = await api.auth.login["staff-lookup"].post(
        { staffCode },
        { fetch: { credentials: "include", headers: devHeaders } },
      );
      return res.data;
    },

    /** Staff PIN login */
    async loginWithStaffPin(staffCode: string, pin: string) {
      const res = await api.auth.login["staff-pin"].post(
        { staffCode, pin },
        { fetch: { credentials: "include", headers: devHeaders } },
      );
      return res.data;
    },

    /** Email/password login (global) - returns available role grants */
    async loginWithEmail(email: string, password: string, tenantId?: string) {
      const res = await api.auth.login.email.post(
        { email, password, tenantId },
        { fetch: { credentials: "include", headers: devHeaders } },
      );
      return res.data;
    },

    /* ─────────────────────────────────────────────────────────
     * Platform auth methods (OAuth login)
     * ───────────────────────────────────────────────────────── */

    /** Redirect to Google OAuth */
    loginWithGoogle() {
      window.location.href = `${baseUrl}/auth/oauth/google`;
    },

    /** Redirect to GitHub OAuth */
    loginWithGitHub() {
      window.location.href = `${baseUrl}/auth/oauth/github`;
    },

    /** Get impersonation token for a tenant (platform admin only) */
    async getImpersonationToken(tenantId: string): Promise<string | undefined> {
      const res = await fetch(
        `${baseUrl}/auth/platform/impersonate/${tenantId}`,
        {
          method: "POST",
          credentials: "include",
          headers: devHeaders,
        },
      );
      if (!res.ok) return undefined;
      const data = await res.json();
      return data?.token;
    },

    /** Update client options (for dev mode switching) */
    updateOptions(newOptions: Partial<AuthClientOptions>) {
      Object.assign(opts, newOptions);
      Object.assign(devHeaders, getDevHeaders(opts));
    },
  };
};

/** @deprecated Use createAuthClient instead - all methods are now unified */
export const createPlatformAuthClient = createAuthClient;
