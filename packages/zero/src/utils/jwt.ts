import jwt from 'jsonwebtoken';

/**
 * JWT utilities for stateless authentication
 * 
 * Two types of JWTs:
 * 1. Refresh JWT (long-lived, HttpOnly cookie) - used to obtain Access JWTs
 * 2. Zero Access JWT (short-lived, response body) - used for zero-cache authentication
 */

// JWT payload interfaces
export interface RefreshJWTPayload {
  sub: string; // staffId
  role: 'staff' | 'admin';
  credVersion: number;
  adminId?: string;
  iat: number;
  exp: number;
}

export interface ZeroAccessJWTPayload {
  // Registered claims
  iss: string; // "rowm-auth"
  aud: string; // "zero-cache"
  sub: string; // staffId (userID for Zero)
  iat: number;
  exp: number;
  
  // Private claims
  role: 'staff' | 'admin';
  staffId: string;
  adminId?: string;
  scopes: string[];
}

/**
 * Create a Refresh JWT (long-lived, for cookie)
 * Used to authenticate requests for Zero Access JWTs
 */
export const createRefreshJWT = (payload: {
  staffId: string;
  role: 'staff' | 'admin';
  credVersion: number;
  adminId?: string;
}): string => {
  const refreshSecret = DMNO_CONFIG.REFRESH_JWT_SECRET;
  if (!refreshSecret) {
    throw new Error('REFRESH_JWT_SECRET not configured');
  }

  const refreshTtlDays = DMNO_CONFIG.REFRESH_TTL_DAYS ?? 30;
  const expiresIn = `${refreshTtlDays}d`;

  return jwt.sign(
    {
      sub: payload.staffId,
      role: payload.role,
      credVersion: payload.credVersion,
      adminId: payload.adminId,
    },
    refreshSecret,
    {
      expiresIn,
      issuer: 'auth',
    }
  );
};

/**
 * Verify and decode a Refresh JWT
 * Returns the payload if valid, throws if invalid/expired
 */
export const verifyRefreshJWT = (token: string): RefreshJWTPayload => {
  const refreshSecret = DMNO_CONFIG.REFRESH_JWT_SECRET;
  if (!refreshSecret) {
    throw new Error('REFRESH_JWT_SECRET not configured');
  }

  try {
    const decoded = jwt.verify(token, refreshSecret, {
      algorithms: ['HS256'],
      issuer: 'rowm-auth',
    }) as RefreshJWTPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    }
    throw error;
  }
};

/**
 * Create a Zero Access JWT (short-lived, for zero-cache)
 * Used to authenticate with zero-cache server
 */
export const createZeroAccessJWT = (payload: {
  staffId: string;
  role: 'staff' | 'admin';
  adminId?: string;
  scopes?: string[];
}): string => {
  const zeroSecret = DMNO_CONFIG.ZERO_AUTH_SECRET;
  if (!zeroSecret) {
    throw new Error('ZERO_AUTH_SECRET not configured');
  }

  // Very short-lived (2-5 minutes)
  const expiresIn = '5m';

  return jwt.sign(
    {
      // Registered claims
      iss: 'rowm-auth',
      aud: 'zero-cache',
      sub: payload.staffId, // userID for Zero must equal sub
      
      // Private claims
      role: payload.role,
      staffId: payload.staffId,
      adminId: payload.adminId,
      scopes: payload.scopes || [],
    },
    zeroSecret,
    {
      algorithm: 'HS256',
      expiresIn,
    }
  );
};

/**
 * Verify and decode a Zero Access JWT
 * Used by zero-cache to validate tokens
 */
export const verifyZeroAccessJWT = (token: string): ZeroAccessJWTPayload => {
  const zeroSecret = DMNO_CONFIG.ZERO_AUTH_SECRET;
  if (!zeroSecret) {
    throw new Error('ZERO_AUTH_SECRET not configured');
  }

  try {
    const decoded = jwt.verify(token, zeroSecret, {
      algorithms: ['HS256'],
      issuer: 'rowm-auth',
      audience: 'zero-cache',
    }) as ZeroAccessJWTPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token expired');
    }
    throw error;
  }
};

/**
 * Cookie configuration for Refresh JWT
 */
export const getRefreshCookieOptions = () => {
  const refreshTtlDays = DMNO_CONFIG.REFRESH_TTL_DAYS ?? 30;
  const maxAge = refreshTtlDays * 24 * 60 * 60 * 1000; // Convert to milliseconds

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
};
