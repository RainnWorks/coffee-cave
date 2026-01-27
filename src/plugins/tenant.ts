import { Elysia } from "elysia";
import { findTenantBySlug } from "../utils/db";

/**
 * Tenant Resolution Middleware
 *
 * Resolves tenant context from the HTTP request using:
 * 1. Subdomain in production (e.g., acme.pos.example.com → tenantId: acme)
 * 2. Dev overrides for local development:
 *    - X-Dev-Tenant header
 *    - ?tenant= query parameter
 *    - DEV_TENANT_OVERRIDE env variable
 *
 * SECURITY: Tenant context is NEVER trusted from client in production.
 * All API routes must use ctx.tenantId from this middleware.
 */

export interface TenantContext {
  tenantId: string | null;
  tenantSlug: string | null;
  tenantName: string | null;
  isDevOverride: boolean;
}

const isDev = process.env.NODE_ENV !== "production";

/**
 * Extract subdomain from host header
 * Examples:
 *   acme.pos.example.com → acme
 *   pos.example.com → null (no subdomain)
 *   localhost:3000 → null
 */
function extractSubdomain(host: string | null): string | null {
  if (!host) return null;

  // Remove port if present
  const hostname = host.split(":")[0];

  // Skip localhost and IP addresses
  if (hostname === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return null;
  }

  const parts = hostname.split(".");

  // Need at least 3 parts for a subdomain (sub.domain.tld)
  // Or 4 parts for sub.domain.co.uk style
  if (parts.length >= 3) {
    return parts[0];
  }

  return null;
}

/**
 * Resolve tenant slug to tenantId via database lookup
 * Uses raw SQL - no ORM dependency
 */
async function resolveTenant(
  slug: string,
): Promise<{ id: string; name: string } | null> {
  return findTenantBySlug(slug);
}

/**
 * Tenant resolution plugin
 *
 * Adds tenantId to request context for all downstream handlers.
 * Must be used before auth routes.
 */
export const tenantPlugin = new Elysia({ name: "tenant" }).derive(
  { as: "global" },
  async ({ headers, request }) => {
    const url = new URL(request.url);
    let tenantSlug: string | null = null;
    let isDevOverride = false;

    // 1. In dev mode, check overrides first
    if (isDev) {
      // Priority: header > query param > env var
      const headerOverride = headers["x-dev-tenant-slug"];
      const queryOverride = url.searchParams.get("tenant");
      const envOverride = process.env.DEV_TENANT_OVERRIDE;

      if (headerOverride) {
        tenantSlug = headerOverride;
        isDevOverride = true;
      } else if (queryOverride) {
        tenantSlug = queryOverride;
        isDevOverride = true;
      } else if (envOverride) {
        tenantSlug = envOverride;
        isDevOverride = true;
      }
    }

    // 2. If no dev override, extract from subdomain
    if (!tenantSlug) {
      const host = headers.host ?? null;
      tenantSlug = extractSubdomain(host);
    }

    // 3. Resolve slug to tenant record
    let tenantId: string | null = null;
    let tenantName: string | null = null;
    if (tenantSlug) {
      const tenant = await resolveTenant(tenantSlug);
      if (tenant) {
        tenantId = tenant.id;
        tenantName = tenant.name;
      }
    }

    const tenantContext: TenantContext = {
      tenantId,
      tenantSlug,
      tenantName,
      isDevOverride,
    };

    return { tenant: tenantContext };
  },
);

/**
 * Guard that requires tenant context
 * Use this on routes that must have a resolved tenant
 */
export const requireTenantPlugin = new Elysia({ name: "require-tenant" })
  .use(tenantPlugin)
  .derive({ as: "scoped" }, ({ tenant, set }) => {
    if (!tenant.tenantId) {
      set.status = 400;
      throw new Error(
        tenant.tenantSlug
          ? `Tenant not found: ${tenant.tenantSlug}`
          : "Tenant context required. Use subdomain or dev override.",
      );
    }
    return {
      tenantId: tenant.tenantId,
      // tenantSlug is guaranteed to exist when tenantId exists (resolved from slug)
      tenantSlug: tenant.tenantSlug ?? tenant.tenantId,
    };
  });

/**
 * Helper to get tenant info for debugging/logging
 */
export function formatTenantContext(ctx: TenantContext): string {
  if (!ctx.tenantId) {
    return "no-tenant";
  }
  return ctx.isDevOverride
    ? `${ctx.tenantSlug} (dev-override)`
    : (ctx.tenantSlug ?? ctx.tenantId);
}
