/**
 * Main authentication module for Coffee Cave
 * 
 * Exports all authentication utilities, routes, and middleware
 * for stateless JWT-based authentication with Zero integration
 */

// Export authentication utilities
export * from '../utils/auth';
export * from '../utils/jwt';
export * from '../utils/rateLimitExpress';

// Export authentication routes
export { default as authRoutes } from './routes';


/**
 * Authentication system overview:
 * 
 * 1. Staff PIN Login (POST /auth/login/staff-pin):
 *    - Validates 6-digit PIN against Argon2 hash
 *    - Issues long-lived Refresh JWT as HttpOnly cookie
 *    - Rate limited per IP and per staffId
 * 
 * 2. Admin Email/Password Login (POST /auth/login/admin):
 *    - Validates email/password against Argon2 hash
 *    - Issues long-lived Refresh JWT as HttpOnly cookie
 *    - Rate limited per IP and per email
 * 
 * 3. Zero Token Exchange (POST /auth/zero-token):
 *    - Validates Refresh JWT from cookie
 *    - Checks credVersion and disabled status
 *    - Issues short-lived Zero Access JWT (2-5 minutes)
 *    - Returns { token, userID } for Zero client
 * 
 * 4. Logout (POST /auth/logout):
 *    - Clears Refresh JWT cookie
 *    - SPA should call dropAllDatabases() for privacy
 * 
 * Security Features:
 * - Stateless: No server-side session storage
 * - Rate limiting: IP-based and identity-based limits
 * - JWT revocation: Via credVersion bumping (no deny-list)
 * - Argon2id hashing: With salt + pepper for passwords/PINs
 * - HttpOnly cookies: Prevent XSS attacks on refresh tokens
 * - Short-lived access tokens: Minimize blast radius
 * 
 * Trade-offs:
 * - Cannot revoke individual tokens without credVersion bump
 * - Relies on Zero's auth refresh mechanism for token renewal
 * - In-memory rate limiting (consider Redis for production)
 */
