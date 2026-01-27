import { useZero, ZeroProvider } from "@rocicorp/zero/react";
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { mutators } from "@/mutators";
import { type Schema, schema } from "../../schema";
import { AuthError, createAuthClient, type RoleGrant } from "./lib/auth-client";
// Import for module augmentation side-effect
import "../../zero/types";

export * from "../../zero/schema.gen";

/**
 * Staff lookup result for the PIN login flow
 */
interface StaffLookupResult {
  principalId: string;
  staffCode: string;
  displayName: string;
}

/**
 * Unified authentication context for all login modes
 */
export interface ZeroAuthContextType {
  // Core state
  isReady: boolean;
  isLoggedIn: boolean;
  isLoading: boolean;
  principalId: string | null;
  displayName: string | null;
  role: string | null;
  scopeKind: "tenant" | "platform" | null;

  // Scope-specific state
  tenantId: string | null;
  email: string | null;
  avatarUrl: string | null;

  // Available role grants (for scope switching)
  availableGrants: RoleGrant[];

  // PIN login methods (tenant-scoped)
  lookupStaff: (
    staffCode: string,
  ) => Promise<
    | { success: true; staff: StaffLookupResult }
    | { success: false; error: string }
  >;
  loginWithPin: (
    staffCode: string,
    pin: string,
  ) => Promise<{ success: true } | { success: false; error: string }>;

  // Email/password login (global)
  loginWithEmail: (
    email: string,
    password: string,
    tenantId?: string,
  ) => Promise<{ success: true } | { success: false; error: string }>;

  // OAuth login
  loginWithGoogle: () => void;
  loginWithGitHub: () => void;

  // Platform methods
  getImpersonationToken: (tenantId: string) => Promise<string | undefined>;

  // Shared
  logout: (dropDatabases?: boolean) => Promise<void>;
}

const ZeroAuthContext = createContext<ZeroAuthContextType | null>(null);

/**
 * Loading component
 */
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

/**
 * Unified ZeroProvider for all authentication modes
 */
export const ZeroAuthProvider: React.FC<{
  children: React.ReactNode;
  zeroCacheServer: string;
  backendServer: string;
  /** Router mode for dev switching */
  routerMode?: "tenant" | "platform";
  /** Dev tenant ID for tenant mode */
  devTenantSlug?: string | null;
}> = ({
  children,
  zeroCacheServer,
  backendServer,
  routerMode,
  devTenantSlug,
}) => {
  // Core state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [principalId, setPrincipalId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [scopeKind, setScopeKind] = useState<"tenant" | "platform" | null>(
    null,
  );
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);

  // Scope-specific state
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [availableGrants, setAvailableGrants] = useState<RoleGrant[]>([]);

  // Auth client with dev mode headers
  const authClient = useMemo(
    () =>
      createAuthClient({
        baseUrl: backendServer,
        mode: routerMode,
        tenantSlug: devTenantSlug,
      }),
    [backendServer, routerMode, devTenantSlug],
  );

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const response = await authClient.me();
        if (response.data?.success) {
          const data = response.data;
          if (data.isLoggedIn) {
            // Fully authenticated user
            setPrincipalId(data.principalId ?? null);
            setDisplayName(data.displayName ?? null);
            setRole(data.role ?? null);
            setScopeKind(data.scopeKind ?? null);
            setTenantId(data.tenantId ?? null);
            setEmail(data.email ?? null);
            setAvatarUrl(data.avatarUrl ?? null);
            setAvailableGrants((data.availableGrants || []) as RoleGrant[]);
            setIsLoggedIn(true);
          } else if (data.anonToken) {
            // Anonymous user with tenant context - use anon token for Zero queries
            setTenantId(data.tenantId ?? null);
            setRole("anon");
            setScopeKind("tenant");
            setAuthToken(data.anonToken);
            // Not logged in, but we have tenant context for queries
          }
        }
      } catch {
        // Not authenticated
      } finally {
        setIsLoading(false);
        setIsReady(true);
      }
    };
    checkAuth();
  }, [authClient]);

  // Fetch auth token when logged in (don't override anon token)
  useEffect(() => {
    if (!isLoggedIn || !principalId) {
      // Don't clear authToken if we have an anon token set
      return;
    }

    const fetchToken = async () => {
      try {
        const token = await authClient.getAccessToken();
        setAuthToken(token);
      } catch {
        setAuthToken(undefined);
      }
    };
    fetchToken();
  }, [isLoggedIn, principalId, authClient]);

  // ─────────────────────────────────────────────────────────────
  // PIN login methods (tenant-scoped)
  // ─────────────────────────────────────────────────────────────

  const lookupStaff = useCallback(
    async (staffCode: string) => {
      try {
        const response = await authClient.lookupStaffByCode(staffCode);
        if (response?.success) {
          return {
            success: true,
            staff: {
              principalId: response.principalId,
              staffCode: response.staffCode,
              displayName: response.displayName,
            },
          } as const;
        }
        return { success: false, error: "Staff not found" } as const;
      } catch {
        return {
          success: false,
          error: "Lookup failed. Please try again.",
        } as const;
      }
    },
    [authClient],
  );

  const loginWithPin = useCallback(
    async (staffCode: string, pin: string) => {
      try {
        const response = await authClient.loginWithStaffPin(staffCode, pin);
        if (response?.success) {
          setPrincipalId(response.principalId ?? null);
          setDisplayName(response.displayName ?? null);
          setRole(response.role ?? null);
          setScopeKind("tenant");
          setTenantId(response.tenantId ?? null);
          setIsLoggedIn(true);
          return { success: true } as const;
        }
        throw new Error("Login failed");
      } catch (err) {
        if (err instanceof AuthError) {
          if (err.statusCode === 429 && err.retryAfter) {
            return {
              success: false,
              error: `Too many attempts. Try again in ${err.retryAfter} seconds.`,
            };
          }
          return { success: false, error: err.message } as const;
        }
        return {
          success: false,
          error: "Login failed. Please try again.",
        } as const;
      }
    },
    [authClient],
  );

  // ─────────────────────────────────────────────────────────────
  // Email/password login (global)
  // ─────────────────────────────────────────────────────────────

  const loginWithEmail = useCallback(
    async (
      emailInput: string,
      password: string,
      requestedTenantId?: string,
    ) => {
      try {
        const response = await authClient.loginWithEmail(
          emailInput,
          password,
          requestedTenantId,
        );
        if (response?.success) {
          setPrincipalId(response.principalId ?? null);
          setDisplayName(response.displayName ?? null);
          setRole(response.role ?? null);
          setScopeKind((response.scopeKind as "tenant" | "platform") ?? null);
          setTenantId(response.tenantId ?? null);
          setEmail(response.email ?? null);
          setAvailableGrants((response.availableGrants || []) as RoleGrant[]);
          setIsLoggedIn(true);
          return { success: true } as const;
        }
        return { success: false, error: "Login failed" } as const;
      } catch (err) {
        if (err instanceof AuthError) {
          if (err.statusCode === 429 && err.retryAfter) {
            return {
              success: false,
              error: `Too many attempts. Try again in ${err.retryAfter} seconds.`,
            };
          }
          return { success: false, error: err.message } as const;
        }
        return {
          success: false,
          error: "Login failed. Please try again.",
        } as const;
      }
    },
    [authClient],
  );

  // ─────────────────────────────────────────────────────────────
  // OAuth login
  // ─────────────────────────────────────────────────────────────

  const loginWithGoogle = useCallback(() => {
    authClient.loginWithGoogle();
  }, [authClient]);

  const loginWithGitHub = useCallback(() => {
    authClient.loginWithGitHub();
  }, [authClient]);

  const getImpersonationToken = useCallback(
    async (tid: string) => {
      return authClient.getImpersonationToken(tid);
    },
    [authClient],
  );

  // ─────────────────────────────────────────────────────────────
  // Shared
  // ─────────────────────────────────────────────────────────────

  const logout = useCallback(
    async (dropDatabases = true) => {
      try {
        await authClient.logout(dropDatabases);
      } catch {
        // Still clear state
      }
      setIsLoggedIn(false);
      setPrincipalId(null);
      setDisplayName(null);
      setRole(null);
      setScopeKind(null);
      setTenantId(null);
      setEmail(null);
      setAvatarUrl(null);
      setAvailableGrants([]);
    },
    [authClient],
  );

  // Build userID for Zero (format: tenantId:principalId or just principalId for platform)
  // For anonymous tenant users, use tenantId:anon
  const userID = useMemo(() => {
    if (principalId) {
      if (scopeKind === "tenant" && tenantId) {
        return `${tenantId}:${principalId}`;
      }
      return principalId;
    }
    // Anonymous user with tenant context
    if (tenantId && role === "anon") {
      return `${tenantId}:anon`;
    }
    return null;
  }, [principalId, scopeKind, tenantId, role]);

  const contextValue: ZeroAuthContextType = useMemo(
    () => ({
      isReady,
      isLoggedIn,
      isLoading,
      principalId,
      displayName,
      role,
      scopeKind,
      tenantId,
      email,
      avatarUrl,
      availableGrants,
      lookupStaff,
      loginWithPin,
      loginWithEmail,
      loginWithGoogle,
      loginWithGitHub,
      getImpersonationToken,
      logout,
    }),
    [
      isReady,
      isLoggedIn,
      isLoading,
      principalId,
      displayName,
      role,
      scopeKind,
      tenantId,
      email,
      avatarUrl,
      availableGrants,
      lookupStaff,
      loginWithPin,
      loginWithEmail,
      loginWithGoogle,
      loginWithGitHub,
      getImpersonationToken,
      logout,
    ],
  );

  if (!isReady) return <LoadingSpinner />;

  const zeroContext = {
    userID: userID || "anon",
    tenantId,
    role,
  };

  console.log(zeroContext);

  return (
    <ZeroAuthContext.Provider value={contextValue}>
      <ZeroProvider
        userID={userID || "anon"}
        cacheURL={zeroCacheServer}
        schema={schema}
        auth={authToken}
        mutators={mutators}
        context={zeroContext}
        mutateURL={`${zeroCacheServer.replace(/:\d+$/, ":3000")}/push`}
      >
        {children}
      </ZeroProvider>
    </ZeroAuthContext.Provider>
  );
};

/**
 * Hook for auth context - works in both tenant and platform mode
 */
export const useZeroAuth = (): ZeroAuthContextType => {
  const context = useContext(ZeroAuthContext);
  if (!context) {
    throw new Error("useZeroAuth must be used within a ZeroAuthProvider");
  }
  return context;
};

export const useTypedZero = useZero<Schema>;
