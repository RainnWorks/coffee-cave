import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { ZeroProvider } from "@rocicorp/zero/react";
import { createAuthClient, AuthError } from "./lib/auth";
import { schema } from "../../schema";
import { createMutators } from "@/mutators";

/**
 * Authentication context - only for auth operations
 * Zero operations use the standard useZero hook from @rocicorp/zero/react
 */
interface AuthContextType {
  // Authentication state
  isLoggedIn: boolean;
  userID: string | null;
  role: "admin" | "staff" | null;
  isLoading: boolean;

  // Authentication methods
  loginStaff: (
    staffId: string,
    pin: string
  ) => Promise<{ success: true } | { success: false; error: string }>;
  loginAdmin: (
    email: string,
    password: string
  ) => Promise<{ success: true } | { success: false; error: string }>;
  logout: (dropDatabases?: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * AuthedZeroProvider - Wraps ZeroProvider with authentication
 *
 * This component handles authentication state and wraps the app with ZeroProvider
 * when authenticated. Use standard useZero hook for Zero operations.
 */
export const AuthedZeroProvider: React.FC<{
  children: React.ReactNode;
  zeroCacheServer: string;
  backendServer: string;
}> = ({ children, zeroCacheServer, backendServer }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userID, setUserID] = useState<string | null>(null);
  const [role, setRole] = useState<"admin" | "staff" | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Create auth client instance (memoized)
  const authClient = useMemo(
    () => createAuthClient(backendServer),
    [backendServer]
  );

  /**
   * Check authentication status on mount
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const response = await authClient.me();

        // Check if the response indicates success and has user data
        if (response.data?.success) {
          // Create userID from the authenticated user data;
          setUserID(response.data.staffId!);
          setIsLoggedIn(response.data.isLoggedIn);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        // Not authenticated or error - stay logged out
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [authClient]);

  /**
   * Staff PIN login (memoized)
   */
  const loginStaff = useCallback(
    async (staffId: string, pin: string) => {
      try {
        const response = await authClient.loginWithStaffPin(staffId, pin);

        // Login successful, create userID and set logged in state
        if (response?.success) {
          setUserID(staffId);
          setIsLoggedIn(true);
          setRole(response.role ?? null);
          return { success: true } as const;
        } else {
          throw new Error("Login failed");
        }
      } catch (err) {
        if (err instanceof AuthError) {
          if (err.statusCode === 429 && err.retryAfter) {
            return {
              success: false,
              error: `Too many attempts. Try again in ${err.retryAfter} seconds.`,
            };
          } else {
            return { success: false, error: err.message } as const;
          }
        } else {
          return {
            success: false,
            error: "Login failed. Please try again.",
          } as const;
        }
      }
    },
    [authClient]
  );

  /**
   * Admin email/password login (memoized)
   */
  const loginAdmin = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await authClient.loginWithAdminCredentials(
          email,
          password
        );

        // Login successful, create userID and set logged in state
        if (response?.success) {
          setUserID(response.staffId);
          setIsLoggedIn(true);
          setRole(response.role);
          return { success: true } as const;
        } else {
          return { success: false, error: "Login failed" } as const;
        }
      } catch (err) {
        if (err instanceof AuthError) {
          if (err.statusCode === 429 && err.retryAfter) {
            return {
              success: false,
              error: `Too many attempts. Try again in ${err.retryAfter} seconds.`,
            };
          } else {
            return { success: false, error: err.message } as const;
          }
        } else {
          return {
            success: false,
            error: "Login failed. Please try again.",
          } as const;
        }
      }
    },
    [authClient]
  );

  /**
   * Logout and cleanup (memoized)
   */
  const handleLogout = useCallback(
    async (dropDatabases: boolean = true) => {
      try {
        // Clear server-side session and optionally drop local databases
        await authClient.logout(dropDatabases);

        // Clear local state
        setIsLoggedIn(false);
        setUserID(null);
      } catch (err) {
        console.error("Logout failed:", err);
        // Still clear local state even if server logout fails
        setIsLoggedIn(false);
        setUserID(null);
      }
    },
    [authClient]
  );

  const authContextValue: AuthContextType = useMemo(
    () => ({
      isLoggedIn,
      userID,
      role,
      isLoading,
      loginStaff,
      loginAdmin,
      logout: handleLogout,
    }),
    [isLoggedIn, userID, isLoading, loginStaff, loginAdmin, handleLogout]
  );

  // Memoized loading component
  const loadingComponent = useMemo(
    () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    ),
    []
  );

  // Memoized Zero auth function
  const zeroAuthFunction = useMemo(
    () => authClient.createZeroAuthFunction(),
    [authClient]
  );

  // Show loading state while checking authentication
  if (isLoading) {
    return loadingComponent;
  }

  // If logged in, wrap with both auth context and ZeroProvider
  return (
    <AuthContext.Provider value={authContextValue}>
      <ZeroProvider
        userID={userID || "anon"}
        server={zeroCacheServer}
        schema={schema}
        auth={zeroAuthFunction}
        mutators={createMutators({
          sub: userID ?? undefined,
          role: role ?? undefined,
        })}
        
      >
        {children}
      </ZeroProvider>
    </AuthContext.Provider>
  );
};

/**
 * Hook to use authentication context
 * Use this for auth operations (login, logout, auth state)
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthedZeroProvider");
  }
  return context;
};
