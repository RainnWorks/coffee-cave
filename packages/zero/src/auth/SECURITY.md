# Stateless Authentication Security Documentation

## Overview

This document outlines the security considerations, trade-offs, and caveats of the stateless JWT-based authentication system implemented for the Coffee Cave Zero-backed SPA.

## Architecture Summary

- **Stateless Design**: No server-side session storage or token tables
- **Dual JWT System**: Long-lived Refresh JWTs (cookies) + Short-lived Zero Access JWTs (response body)
- **Zero Integration**: Access JWTs specifically designed for zero-cache authentication
- **Revocation Strategy**: credVersion-based invalidation without per-token tracking

## Security Features

### 1. Password/PIN Security
- **Argon2id Hashing**: Industry-standard password hashing with resistance to GPU and side-channel attacks
- **Salt + Pepper**: Per-user salt combined with application-wide pepper for enhanced security
- **PIN Constraints**: 6-digit PINs with strict rate limiting to mitigate brute force attacks
- **Password Requirements**: Minimum 8 characters for admin passwords

### 2. JWT Security
- **HS256 Signing**: Symmetric key signing with separate secrets for Refresh and Access JWTs
- **Short-lived Access Tokens**: 2-5 minute TTL minimizes blast radius of compromised tokens
- **HttpOnly Cookies**: Refresh JWTs stored in HttpOnly cookies prevent XSS attacks
- **Secure Cookie Settings**: Secure, SameSite=Lax, Path=/ for production security

### 3. Rate Limiting
- **IP-based Limits**: 30 requests per hour per IP address
- **Identity-based Limits**: 5 attempts per 15 minutes per staffId/email
- **Combined Protection**: Both IP and identity limits enforced simultaneously
- **Express-rate-limit**: Standard, battle-tested rate limiting middleware

### 4. Revocation Mechanism
- **credVersion Field**: Integer field in Staff/Admin models for token invalidation
- **Stateless Revocation**: Increment credVersion to invalidate all user's JWTs
- **Disabled Users**: disabledAt timestamp for immediate user deactivation
- **Version Validation**: Every token use validates credVersion against database

## Trade-offs and Limitations

### 1. Token Revocation Limitations

**Limitation**: Cannot revoke individual JWT tokens without introducing server-side state.

**Impact**: 
- Stolen refresh tokens remain valid until expiry (up to 30 days)
- Cannot implement "logout from all devices" without credVersion bump
- No audit trail of active sessions

**Mitigation Strategies**:
- Keep refresh token TTL reasonable (30 days default)
- Implement credVersion bumping on password/PIN changes
- Use disabledAt for immediate user deactivation
- Monitor for suspicious activity patterns

**Alternative Solutions** (if individual revocation needed):
- Implement JWT deny-list (reintroduces state)
- Use shorter refresh token TTL with automatic renewal
- Implement session tracking table (abandons stateless design)

### 2. Rate Limiting Scope

**Current Implementation**: In-memory rate limiting per application instance

**Limitations**:
- Rate limits don't persist across server restarts
- Load-balanced deployments have per-instance limits
- No distributed rate limiting coordination

**Production Considerations**:
- Consider Redis-backed rate limiting for distributed systems
- Implement sticky sessions if using in-memory rate limiting
- Monitor rate limiting effectiveness across instances

### 3. Zero Integration Dependencies

**Dependency**: Relies on Zero's token refresh mechanism for access token renewal

**Implications**:
- Zero must handle token expiry gracefully
- Network issues during token refresh can cause authentication failures
- Client-side error handling critical for user experience

**Mitigation**:
- Implement robust error handling in Zero auth function
- Provide clear user feedback for authentication failures
- Consider implementing exponential backoff for token refresh

## Security Best Practices

### 1. Environment Configuration

```bash
# Required secrets (use strong, random values)
REFRESH_JWT_SECRET="your-long-random-secret-for-refresh-tokens"
ZERO_AUTH_SECRET="your-long-random-secret-for-zero-tokens"
AUTH_PEPPER="your-application-wide-pepper-for-hashing"

# Optional settings
REFRESH_TTL_DAYS=30
NODE_ENV=production
```

### 2. HTTPS Requirements

- **Production**: Always use HTTPS to protect JWT cookies and API calls
- **Development**: Consider using HTTPS even in development for testing
- **Proxy Configuration**: Ensure proper trust proxy settings for rate limiting

### 3. Monitoring and Logging

**Log Security Events**:
- Successful/failed login attempts with IP addresses
- Rate limiting triggers
- JWT verification failures
- credVersion mismatches

**Monitor for**:
- Unusual login patterns
- High rate limiting trigger rates
- JWT verification failure spikes
- Geographic anomalies in access patterns

### 4. Database Security

**Protect Sensitive Fields**:
- pinHash, pinSalt, passwordHash, passwordSalt
- credVersion (critical for token revocation)
- disabledAt timestamps

**Access Controls**:
- Limit database access to application service accounts
- Use read-only connections where possible
- Implement database audit logging

## Incident Response

### 1. Compromised Refresh Token

**Immediate Actions**:
1. Increment user's credVersion to invalidate all tokens
2. Force password/PIN reset
3. Review access logs for suspicious activity
4. Consider temporary account disabling

### 2. Compromised JWT Secret

**Immediate Actions**:
1. Rotate JWT signing secrets (REFRESH_JWT_SECRET, ZERO_AUTH_SECRET)
2. Force all users to re-authenticate
3. Increment all credVersions as precaution
4. Review application logs for unauthorized access

### 3. Rate Limiting Bypass

**Investigation Steps**:
1. Check for distributed attacks across IP ranges
2. Verify rate limiting configuration and implementation
3. Consider implementing additional protection layers
4. Review authentication attempt patterns

## Compliance Considerations

### Data Privacy
- Consider implementing automatic database cleanup on logout
- Zero's dropAllDatabases() removes local user data
- Implement data retention policies for logs

### Audit Requirements
- Log all authentication events with timestamps
- Maintain credVersion change history
- Track administrative actions (user disabling, etc.)

## Future Enhancements

### Potential Improvements
1. **JWT Deny-list**: For individual token revocation (adds state)
2. **Device Tracking**: Track and manage user devices/sessions
3. **Biometric Integration**: Enhanced authentication for sensitive operations
4. **Risk-based Authentication**: Adaptive security based on user behavior
5. **Token Binding**: Bind JWTs to specific client characteristics

### Monitoring Enhancements
1. **Security Dashboard**: Real-time authentication metrics
2. **Anomaly Detection**: ML-based suspicious activity detection
3. **Automated Response**: Automatic account protection measures

## Conclusion

This stateless authentication system provides a good balance of security and scalability for the Coffee Cave application. The main trade-off is the inability to revoke individual tokens, which is mitigated through credVersion-based revocation and short-lived access tokens.

Regular security reviews and monitoring are essential to maintain the effectiveness of these security measures.
