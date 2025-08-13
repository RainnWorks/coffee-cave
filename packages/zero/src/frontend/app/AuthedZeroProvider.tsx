import React, { createContext, useContext, useState, useEffect } from "react";
import { ZeroProvider } from "@rocicorp/zero/react";
import { createAuthClient, AuthError } from "./auth";
import { schema } from "../../schema";

/**
 * Authentication context - only for auth operations
 * Zero operations use the standard useZero hook from @rocicorp/zero/react
 */
interface AuthContextType {
  // Authentication state
  isLoggedIn: boolean;
  userID: string | null;
  isLoading: boolean;
  error: string | null;

  // Authentication methods
  loginStaff: (staffId: string, pin: string) => Promise<void>;
  loginAdmin: (email: string, password: string) => Promise<void>;
  logout: (dropDatabases?: boolean) => Promise<void>;
  clearError: () => void;
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create auth client instance
  const authClient = createAuthClient(backendServer);

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
          setIsLoggedIn(true);
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
   * Staff PIN login
   */
  const loginStaff = async (staffId: string, pin: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authClient.loginWithStaffPin(staffId, pin);

      // Login successful, create userID and set logged in state
      if (response?.success) {
        setUserID(staffId);
        setIsLoggedIn(true);
      } else {
        throw new Error("Login failed");
      }
    } catch (err) {
      if (err instanceof AuthError) {
        if (err.statusCode === 429 && err.retryAfter) {
          setError(
            `Too many attempts. Try again in ${err.retryAfter} seconds.`
          );
        } else {
          setError(err.message);
        }
      } else {
        setError("Login failed. Please try again.");
      }
      console.error("Staff login failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Admin email/password login
   */
  const loginAdmin = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authClient.loginWithAdminCredentials(
        email,
        password
      );

      // Login successful, create userID and set logged in state
      if (response?.success) {
        setUserID(response.staffId);
        setIsLoggedIn(true);
      } else {
        throw new Error("Login failed");
      }
    } catch (err) {
      if (err instanceof AuthError) {
        if (err.statusCode === 429 && err.retryAfter) {
          setError(
            `Too many attempts. Try again in ${err.retryAfter} seconds.`
          );
        } else {
          setError(err.message);
        }
      } else {
        setError("Login failed. Please try again.");
      }
      console.error("Admin login failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout and cleanup
   */
  const handleLogout = async (dropDatabases: boolean = true) => {
    try {
      setIsLoading(true);

      // Clear server-side session and optionally drop local databases
      await authClient.logout(dropDatabases);

      // Clear local state
      setIsLoggedIn(false);
      setUserID(null);
      setError(null);
    } catch (err) {
      console.error("Logout failed:", err);
      // Still clear local state even if server logout fails
      setIsLoggedIn(false);
      setUserID(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null);
  };

  const authContextValue: AuthContextType = {
    isLoggedIn,
    userID,
    isLoading,
    error,
    loginStaff,
    loginAdmin,
    logout: handleLogout,
    clearError,
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If logged in, wrap with both auth context and ZeroProvider
  return (
    <AuthContext.Provider value={authContextValue}>
      <ZeroProvider
        userID={userID || "anon"}
        server={zeroCacheServer}
        schema={schema}
        auth={authClient.createZeroAuthFunction()}
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
