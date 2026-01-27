import rateLimit from "express-rate-limit";

/**
 * Rate limiting middleware using express-rate-limit
 *
 * Replaces the custom in-memory rate limiting with the standard express-rate-limit package
 */

/**
 * Rate limiting for IP addresses (30 requests per hour)
 */
export const ipRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // limit each IP to 30 requests per windowMs
  message: {
    error: "Too many requests from this IP address",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Use IP address as the key
  keyGenerator: (req) => {
    return (
      req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
      req.headers["x-real-ip"]?.toString() ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      "unknown"
    );
  },
});

/**
 * Rate limiting for staff PIN attempts (5 requests per 15 minutes per staffId)
 */
export const staffPinRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each staffId to 5 requests per windowMs
  message: {
    error: "Too many PIN attempts for this staff member",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use staffId from request body as the key
  keyGenerator: (req) => {
    return req.body?.staffId || "unknown";
  },
  // Skip if no staffId provided (will be caught by validation)
  skip: (req) => !req.body?.staffId,
});

/**
 * Rate limiting for admin email attempts (5 requests per 15 minutes per email)
 */
export const adminEmailRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each email to 5 requests per windowMs
  message: {
    error: "Too many login attempts for this email",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use lowercased email from request body as the key
  keyGenerator: (req) => {
    return req.body?.email?.toLowerCase() || "unknown";
  },
  // Skip if no email provided (will be caught by validation)
  skip: (req) => !req.body?.email,
});

/**
 * Combined rate limiter that applies both IP and identity-based limits
 * This ensures both IP-based and identity-based rate limiting are enforced
 */
export const createCombinedRateLimit = (
  identityRateLimit: ReturnType<typeof rateLimit>,
) => {
  return [ipRateLimit, identityRateLimit];
};
