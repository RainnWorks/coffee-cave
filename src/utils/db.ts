import { SQL } from "bun";

/**
 * Raw SQL database connection for auth-critical queries
 *
 * This module provides minimal, direct database access for:
 * - Tenant resolution (before auth)
 * - Principal/Credential verification
 * - Auth bootstrap operations
 *
 * All other queries should go through Zero.
 *
 * WHY RAW SQL?
 * - No ORM dependency for runtime queries
 * - Bun's native SQL driver for best performance
 * - Minimal surface area for auth-critical code
 */

// Bun's native postgres connection
export const sql = new SQL(DMNO_CONFIG.ZERO_UPSTREAM_DB);

// ============================================================================
// Type definitions for auth queries
// ============================================================================

export interface TenantRow {
  id: string;
  name: string;
  slug: string;
}

export interface PrincipalRow {
  id: string;
  kind: string;
  displayName: string;
  avatarUrl: string | null;
  globalCredVersion: number;
}

export interface PinCredentialRow {
  id: string;
  principalId: string;
  tenantId: string;
  staffCode: string;
  pinHash: string;
  pinSalt: string;
  revokedAt: Date | null;
}

export interface PinCredentialWithPrincipalRow extends PinCredentialRow {
  displayName: string;
  avatarUrl: string | null;
  globalCredVersion: number;
}

export interface PasswordCredentialRow {
  id: string;
  principalId: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  revokedAt: Date | null;
}

export interface PasswordCredentialWithPrincipalRow
  extends PasswordCredentialRow {
  displayName: string;
  avatarUrl: string | null;
  globalCredVersion: number;
}

export interface OAuthCredentialRow {
  id: string;
  principalId: string;
  provider: string;
  providerId: string;
  email: string | null;
  revokedAt: Date | null;
}

export interface OAuthCredentialWithPrincipalRow extends OAuthCredentialRow {
  displayName: string;
  avatarUrl: string | null;
  globalCredVersion: number;
}

export interface RoleGrantRow {
  id: string;
  principalId: string;
  scopeKind: string;
  tenantId: string | null;
  role: string;
  grantedAt: Date;
  revokedAt: Date | null;
}

// ============================================================================
// Tenant queries
// ============================================================================

/**
 * Resolve tenant by slug (subdomain)
 * Used before authentication to establish tenant context
 *
 * Slug rules:
 * - Lowercase alphanumeric + hyphens only
 * - Max 63 chars (DNS subdomain limit)
 * - No leading/trailing hyphens
 * - No consecutive hyphens
 */
export async function findTenantBySlug(
  slug: string,
): Promise<TenantRow | null> {
  // Normalize input: lowercase, trim
  const normalizedSlug = slug.toLowerCase().trim();

  const rows = (await sql`
    SELECT id, name, slug 
    FROM tenant 
    WHERE slug = ${normalizedSlug}
    LIMIT 1
  `) as TenantRow[];
  return rows[0] ?? null;
}

/**
 * Validate a slug conforms to subdomain rules
 * - Lowercase alphanumeric + hyphens
 * - 1-63 characters
 * - No leading/trailing/consecutive hyphens
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || slug.length > 63) return false;
  // RFC 1123 subdomain: lowercase alphanumeric, hyphens allowed (not at start/end)
  const slugRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  // No consecutive hyphens
  if (slug.includes("--")) return false;
  return slugRegex.test(slug);
}

/**
 * Generate a slug from a name
 * - Lowercase
 * - Replace spaces/underscores with hyphens
 * - Remove non-alphanumeric (except hyphens)
 * - Collapse consecutive hyphens
 * - Trim hyphens from ends
 * - Truncate to 63 chars
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-") // spaces/underscores → hyphens
    .replace(/[^a-z0-9-]/g, "") // remove invalid chars
    .replace(/-+/g, "-") // collapse consecutive hyphens
    .replace(/^-|-$/g, "") // trim hyphens from ends
    .slice(0, 63);
}

// ============================================================================
// Principal queries
// ============================================================================

/**
 * Find principal by ID
 */
export async function findPrincipalById(
  principalId: string,
): Promise<PrincipalRow | null> {
  const rows = (await sql`
    SELECT id, kind, "displayName", "avatarUrl", "globalCredVersion"
    FROM principal
    WHERE id = ${principalId}
    LIMIT 1
  `) as PrincipalRow[];
  return rows[0] ?? null;
}

// ============================================================================
// PIN Credential queries (for tenant PIN login)
// ============================================================================

/**
 * Find PIN credential by tenant + staffCode (for name lookup before PIN entry)
 * Returns principal info for display
 */
export async function findPinCredentialByCode(
  tenantId: string,
  staffCode: string,
): Promise<{
  principalId: string;
  displayName: string;
  staffCode: string;
} | null> {
  const rows = (await sql`
    SELECT 
      pc."principalId",
      p."displayName",
      pc."staffCode"
    FROM pin_credential pc
    JOIN principal p ON pc."principalId" = p.id
    WHERE pc."tenantId" = ${tenantId} 
      AND pc."staffCode" = ${staffCode}
      AND pc."revokedAt" IS NULL
    LIMIT 1
  `) as { principalId: string; displayName: string; staffCode: string }[];
  return rows[0] ?? null;
}

/**
 * Find PIN credential with hash for authentication
 */
export async function findPinCredentialWithHash(
  tenantId: string,
  staffCode: string,
): Promise<PinCredentialWithPrincipalRow | null> {
  const rows = (await sql`
    SELECT 
      pc.id,
      pc."principalId",
      pc."tenantId",
      pc."staffCode",
      pc."pinHash",
      pc."pinSalt",
      pc."revokedAt",
      p."displayName",
      p."avatarUrl",
      p."globalCredVersion"
    FROM pin_credential pc
    JOIN principal p ON pc."principalId" = p.id
    WHERE pc."tenantId" = ${tenantId} 
      AND pc."staffCode" = ${staffCode}
      AND pc."revokedAt" IS NULL
    LIMIT 1
  `) as PinCredentialWithPrincipalRow[];
  return rows[0] ?? null;
}

// ============================================================================
// Password Credential queries (for email/password login)
// ============================================================================

/**
 * Find password credential by email (global lookup)
 */
export async function findPasswordCredentialByEmail(
  email: string,
): Promise<PasswordCredentialWithPrincipalRow | null> {
  const rows = (await sql`
    SELECT 
      pc.id,
      pc."principalId",
      pc.email,
      pc."passwordHash",
      pc."passwordSalt",
      pc."revokedAt",
      p."displayName",
      p."avatarUrl",
      p."globalCredVersion"
    FROM password_credential pc
    JOIN principal p ON pc."principalId" = p.id
    WHERE LOWER(pc.email) = LOWER(${email})
      AND pc."revokedAt" IS NULL
    LIMIT 1
  `) as PasswordCredentialWithPrincipalRow[];
  return rows[0] ?? null;
}

// ============================================================================
// OAuth Credential queries (for OAuth login)
// ============================================================================

/**
 * Find OAuth credential by provider + providerId
 */
export async function findOAuthCredential(
  provider: string,
  providerId: string,
): Promise<OAuthCredentialWithPrincipalRow | null> {
  const rows = (await sql`
    SELECT 
      oc.id,
      oc."principalId",
      oc.provider,
      oc."providerId",
      oc.email,
      oc."revokedAt",
      p."displayName",
      p."avatarUrl",
      p."globalCredVersion"
    FROM oauth_credential oc
    JOIN principal p ON oc."principalId" = p.id
    WHERE oc.provider = ${provider}
      AND oc."providerId" = ${providerId}
      AND oc."revokedAt" IS NULL
    LIMIT 1
  `) as OAuthCredentialWithPrincipalRow[];
  return rows[0] ?? null;
}

/**
 * Update last used timestamp for OAuth credential
 */
export async function updateOAuthCredentialLastUsed(id: string): Promise<void> {
  await sql`
    UPDATE oauth_credential SET "lastUsedAt" = NOW() WHERE id = ${id}
  `;
}

// ============================================================================
// Role Grant queries
// ============================================================================

/**
 * Find active role grants for a principal
 */
export async function findRoleGrantsForPrincipal(
  principalId: string,
): Promise<RoleGrantRow[]> {
  const rows = (await sql`
    SELECT id, "principalId", "scopeKind", "tenantId", role, "grantedAt", "revokedAt"
    FROM role_grant
    WHERE "principalId" = ${principalId}
      AND "revokedAt" IS NULL
    ORDER BY "grantedAt" DESC
  `) as RoleGrantRow[];
  return rows;
}

/**
 * Find active role grant for a principal in a specific scope
 */
export async function findRoleGrantForScope(
  principalId: string,
  scopeKind: "platform" | "tenant",
  tenantId?: string,
): Promise<RoleGrantRow | null> {
  if (scopeKind === "platform") {
    const rows = (await sql`
      SELECT id, "principalId", "scopeKind", "tenantId", role, "grantedAt", "revokedAt"
      FROM role_grant
      WHERE "principalId" = ${principalId}
        AND "scopeKind" = 'platform'
        AND "revokedAt" IS NULL
      ORDER BY "grantedAt" DESC
      LIMIT 1
    `) as RoleGrantRow[];
    return rows[0] ?? null;
  }

  if (!tenantId) return null;

  const rows = (await sql`
    SELECT id, "principalId", "scopeKind", "tenantId", role, "grantedAt", "revokedAt"
    FROM role_grant
    WHERE "principalId" = ${principalId}
      AND "scopeKind" = 'tenant'
      AND "tenantId" = ${tenantId}
      AND "revokedAt" IS NULL
    ORDER BY "grantedAt" DESC
    LIMIT 1
  `) as RoleGrantRow[];
  return rows[0] ?? null;
}

// ============================================================================
// Principal + Credential creation (for staff/admin onboarding)
// ============================================================================

/**
 * Create a new principal
 */
export async function createPrincipal(data: {
  id: string;
  kind: "human" | "machine";
  displayName: string;
  avatarUrl?: string | null;
}): Promise<void> {
  await sql`
    INSERT INTO principal (id, kind, "displayName", "avatarUrl", "globalCredVersion", "createdAt", "updatedAt")
    VALUES (${data.id}, ${data.kind}, ${data.displayName}, ${data.avatarUrl ?? null}, 1, NOW(), NOW())
  `;
}

/**
 * Create a PIN credential for a principal
 */
export async function createPinCredential(data: {
  id: string;
  principalId: string;
  tenantId: string;
  staffCode: string;
  pinHash: string;
  pinSalt: string;
}): Promise<void> {
  await sql`
    INSERT INTO pin_credential (id, "principalId", "tenantId", "staffCode", "pinHash", "pinSalt", "createdAt")
    VALUES (${data.id}, ${data.principalId}, ${data.tenantId}, ${data.staffCode}, ${data.pinHash}, ${data.pinSalt}, NOW())
  `;
}

/**
 * Create a password credential for a principal
 */
export async function createPasswordCredential(data: {
  id: string;
  principalId: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
}): Promise<void> {
  await sql`
    INSERT INTO password_credential (id, "principalId", email, "passwordHash", "passwordSalt", "createdAt")
    VALUES (${data.id}, ${data.principalId}, ${data.email}, ${data.passwordHash}, ${data.passwordSalt}, NOW())
  `;
}

/**
 * Create an OAuth credential for a principal
 */
export async function createOAuthCredential(data: {
  id: string;
  principalId: string;
  provider: string;
  providerId: string;
  email?: string | null;
}): Promise<void> {
  await sql`
    INSERT INTO oauth_credential (id, "principalId", provider, "providerId", email, "createdAt", "lastUsedAt")
    VALUES (${data.id}, ${data.principalId}, ${data.provider}, ${data.providerId}, ${data.email ?? null}, NOW(), NOW())
  `;
}

/**
 * Create a role grant for a principal
 */
export async function createRoleGrant(data: {
  id: string;
  principalId: string;
  scopeKind: "platform" | "tenant";
  tenantId?: string | null;
  role: string;
  grantedByPrincipalId?: string | null;
}): Promise<void> {
  await sql`
    INSERT INTO role_grant (id, "principalId", "scopeKind", "tenantId", role, "grantedAt", "grantedByPrincipalId")
    VALUES (${data.id}, ${data.principalId}, ${data.scopeKind}, ${data.tenantId ?? null}, ${data.role}, NOW(), ${data.grantedByPrincipalId ?? null})
  `;
}

/**
 * Revoke a role grant
 */
export async function revokeRoleGrant(roleGrantId: string): Promise<void> {
  await sql`
    UPDATE role_grant SET "revokedAt" = NOW() WHERE id = ${roleGrantId}
  `;
}

/**
 * Update PIN credential (reset PIN)
 */
export async function updatePinCredential(
  id: string,
  pinHash: string,
  pinSalt: string,
): Promise<void> {
  await sql`
    UPDATE pin_credential SET "pinHash" = ${pinHash}, "pinSalt" = ${pinSalt} WHERE id = ${id}
  `;
}

/**
 * Bump global cred version for a principal (invalidates all sessions)
 */
export async function bumpPrincipalCredVersion(
  principalId: string,
): Promise<void> {
  await sql`
    UPDATE principal SET "globalCredVersion" = "globalCredVersion" + 1, "updatedAt" = NOW() WHERE id = ${principalId}
  `;
}
