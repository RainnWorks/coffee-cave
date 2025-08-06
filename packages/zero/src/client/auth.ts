/**
 * Frontend authentication utilities for Zero SPA integration
 * 
 * Provides client-side authentication functions that work with the stateless auth system
 */

/**
 * Authentication API endpoints
 */
const AUTH_ENDPOINTS = {
  STAFF_PIN_LOGIN: '/auth/login/staff-pin',
  ADMIN_LOGIN: '/auth/login/admin',
  ZERO_TOKEN: '/auth/zero-token',
  LOGOUT: '/auth/logout',
} as const;

/**
 * Authentication error types
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Staff PIN login
 * @param staffId - Staff member ID
 * @param pin - 6-digit PIN
 * @returns Promise that resolves on successful login
 */
export const loginWithStaffPin = async (
  staffId: string,
  pin: string
): Promise<void> => {
  const response = await fetch(AUTH_ENDPOINTS.STAFF_PIN_LOGIN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies
    body: JSON.stringify({ staffId, pin }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Login failed' }));
    
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '0');
      throw new AuthError(error.error || 'Too many requests', 429, retryAfter);
    }
    
    throw new AuthError(error.error || 'Login failed', response.status);
  }
};

/**
 * Admin email/password login
 * @param email - Admin email address
 * @param password - Admin password
 * @returns Promise that resolves on successful login
 */
export const loginWithAdminCredentials = async (
  email: string,
  password: string
): Promise<void> => {
  const response = await fetch(AUTH_ENDPOINTS.ADMIN_LOGIN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Login failed' }));
    
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '0');
      throw new AuthError(error.error || 'Too many requests', 429, retryAfter);
    }
    
    throw new AuthError(error.error || 'Login failed', response.status);
  }
};

/**
 * Get Zero Access JWT for authentication with zero-cache
 * This function is called by Zero when it needs to authenticate
 * @returns Promise that resolves to the access token
 */
export const getZeroAccessToken = async (): Promise<string> => {
  const response = await fetch(AUTH_ENDPOINTS.ZERO_TOKEN, {
    method: 'POST',
    credentials: 'include', // Include refresh token cookie
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Authentication failed' }));
    throw new AuthError(error.error || 'Authentication failed', response.status);
  }

  const data = await response.json();
  return data.token;
};

/**
 * Logout and clear authentication
 * @param dropDatabases - Whether to drop local Zero databases for privacy
 * @returns Promise that resolves when logout is complete
 */
export const logout = async (dropDatabases: boolean = true): Promise<void> => {
  // Clear refresh token cookie on server
  await fetch(AUTH_ENDPOINTS.LOGOUT, {
    method: 'POST',
    credentials: 'include',
  });

  // Optionally drop local Zero databases for privacy
  if (dropDatabases && typeof window !== 'undefined') {
    try {
      // Import Zero's dropAllDatabases function if available
      const { dropAllDatabases } = await import('@rocicorp/zero');
      await dropAllDatabases();
    } catch (error) {
      console.warn('Could not drop Zero databases:', error);
    }
  }
};

/**
 * Check if user is authenticated by attempting to get a Zero token
 * @returns Promise that resolves to true if authenticated, false otherwise
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    await getZeroAccessToken();
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Zero authentication configuration
 * This is the auth function that Zero will call to get access tokens
 */
export const createZeroAuthFunction = () => {
  return async (): Promise<string> => {
    try {
      return await getZeroAccessToken();
    } catch (error) {
      console.error('Zero authentication failed:', error);
      throw error;
    }
  };
};

/**
 * Get user ID for Zero client
 * This extracts the userID from the Zero token response
 * @returns Promise that resolves to the userID (staffId)
 */
export const getZeroUserID = async (): Promise<string> => {
  const response = await fetch(AUTH_ENDPOINTS.ZERO_TOKEN, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Authentication failed' }));
    throw new AuthError(error.error || 'Authentication failed', response.status);
  }

  const data = await response.json();
  return data.userID;
};
