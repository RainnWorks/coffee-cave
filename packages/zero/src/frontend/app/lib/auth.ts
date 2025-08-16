import { client } from "../../../client";

/* ─────────────────────────────────────────────── errors ── */

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly retryAfter?: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/* ─────────────────────────────────────── client factory ── */

export const createAuthClient = (baseUrl = "") => {
  /** Eden Treaty instance pointed at the server (cookies flow automatically) */
  const api = client(baseUrl);

  return {
    async me() {
      return api.auth.me.get({
        fetch: {
          credentials: "include",
        },
      });
    },
    /* -------- staff PIN login -------- */
    async loginWithStaffPin(staffId: string, pin: string) {
      const res = await api.auth.login["staff-pin"].post(
        { staffId, pin },
        {
          fetch: {
            credentials: "include",
          },
        }
      );
      return res.data;
    },

    /* -------- admin email/password login -------- */
    async loginWithAdminCredentials(email: string, password: string) {
      const res = await api.auth.login.admin.post(
        { email, password },
        {
          fetch: {
            credentials: "include",
          },
        }
      );
      return res.data;
    },

    /* -------- obtain Zero access token -------- */
    async getAccessToken(): Promise<string | undefined> {
      const res = await api.auth["zero-token"].post(undefined, {
        fetch: {
          credentials: "include",
        },
      });
      return res.data?.token;
    },

    /* -------- logout & optional local DB purge -------- */
    async logout(dropDatabases = true): Promise<void> {
      await api.auth.logout.post(undefined, {
        fetch: {
          credentials: "include",
        },
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

    /* -------- Zero auth function factory -------- */
    createZeroAuthFunction() {
      const self = this;
      return async (error?: "invalid-token"): Promise<string | undefined> => {
        if (error === "invalid-token")
          console.log("Zero reported invalid token, refreshing...");
        try {
          return await self.getAccessToken();
        } catch {
          return undefined;
        }
      };
    },
  };
};
