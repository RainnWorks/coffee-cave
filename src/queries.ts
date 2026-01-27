/**
 * Zero v0.25 Query Definitions
 *
 * All queries are defined here with auth context for permissions.
 * Permissions are enforced via ZQL filters based on ctx (from JWT).
 *
 * Permission model (implemented via ZQL filters, never throwing):
 * - Public: menu content, settings (read), staff list (for login) - tenant filter only
 * - Staff/Admin: operational data (tabs, payments, tables, allergens) - tenant + role filter
 * - Admin only: role grants, sensitive data - tenant + admin role filter
 * - Platform: cross-tenant queries - platform role filter
 *
 * Tenant isolation: All queries filter by tenantId from context.
 * Role checks: Use cmpLit to compare ctx.role against required roles.
 *
 * Usage in components:
 *   const [data] = useQuery(queries.kitchen.preppingItems())
 */
import { defineQueries, defineQuery } from "@rocicorp/zero";
import { z } from "zod";
import { zql } from "@/zero/schema.gen.ts";
import type { ZeroContext } from "@/zero/types.ts";
// Import for module augmentation side-effect
import "@/zero/types.ts";

// Re-export for backwards compatibility
export type QueryContext = ZeroContext;

// ============================================================================
// PERMISSION HELPERS (ZQL Filter-based)
// ============================================================================
// SECURITY: The JWT contains tenantId + role. A user's role is ALWAYS
// tenant-specific - i.e., being "staff" for tenant A does NOT grant access
// to tenant B. The JWT is issued per-tenant during login.
//
// These helpers return boolean checks that can be used to conditionally
// build queries. When permission is denied, queries return empty results
// via .limit(0) rather than throwing errors.
//
// Permission hierarchy:
// - platform: Can access any tenant's data (cross-tenant)
// - admin: Full access within their tenant
// - staff: Operational access within their tenant
// - anon: Public read access only (menu, settings)
// ============================================================================

/**
 * Check if context has a valid tenant
 */
const hasTenant = (ctx: QueryContext): ctx is QueryContext & { tenantId: string } => {
  return typeof ctx.tenantId === "string" && ctx.tenantId.length > 0;
};

/**
 * Check if context has staff or admin role (or platform)
 */
const isStaffOrAdmin = (ctx: QueryContext): boolean => {
  return ctx.role === "staff" || ctx.role === "admin" || ctx.role === "platform";
};

/**
 * Check if context has admin role (or platform)
 */
const isAdmin = (ctx: QueryContext): boolean => {
  return ctx.role === "admin" || ctx.role === "platform";
};

/**
 * Check if context has platform admin role
 */
const isPlatformAdmin = (ctx: QueryContext): boolean => {
  return ctx.role === "platform";
};

// ============================================================================
// PRINCIPAL QUERIES - Requires authentication
// ============================================================================
// NOTE: The login flow uses server-side API endpoints (/auth/login/staff-lookup)
// NOT Zero queries. These queries are for authenticated staff/admin use only.
const principalQueries = {
  /**
   * List all principals with PIN credentials in tenant (staff members)
   * STAFF/ADMIN - for staff management, not login
   * Returns empty if no tenant or insufficient role
   */
  listStaff: defineQuery(({ ctx }: { ctx: QueryContext }) => {
    if (!hasTenant(ctx) || !isStaffOrAdmin(ctx)) {
      return zql.pinCredential.limit(0);
    }
    return zql.pinCredential.where("tenantId", ctx.tenantId).related("principal");
  }),

  /**
   * Get principal by ID with their role grants
   * STAFF/ADMIN - for viewing principal details
   * Returns null if insufficient role
   */
  byId: defineQuery(
    z.object({ id: z.string() }),
    ({ args: { id }, ctx }: { args: { id: string }; ctx: QueryContext }) => {
      if (!hasTenant(ctx) || !isStaffOrAdmin(ctx)) {
        return zql.principal.limit(0).one();
      }
      return zql.principal
        .where("id", id)
        .related("roleGrants")
        .related("pinCredentials")
        .one();
    },
  ),

  /**
   * Get role grants for current tenant
   * ADMIN - for managing permissions
   * Returns empty if no tenant or not admin
   */
  roleGrantsForTenant: defineQuery(({ ctx }: { ctx: QueryContext }) => {
    if (!hasTenant(ctx) || !isAdmin(ctx)) {
      return zql.roleGrant.limit(0);
    }
    return zql.roleGrant.where("tenantId", ctx.tenantId).related("principal");
  }),
};

// ============================================================================
// LOGIN QUERIES - Public queries for login flow (tenant required)
// ============================================================================
const loginQueries = {
  /**
   * Look up staff by 3-digit code for PIN login
   * PUBLIC - needed for login flow before authentication
   * Returns only non-sensitive info (displayName, staffCode, principalId)
   * Returns null if no tenant context
   */
  staffByCode: defineQuery(
    z.object({ staffCode: z.string() }),
    ({
      args: { staffCode },
      ctx,
    }: {
      args: { staffCode: string };
      ctx: QueryContext;
    }) => {
      if (!hasTenant(ctx)) {
        return zql.pinCredential.limit(0).one();
      }
      return zql.pinCredential
        .where("tenantId", ctx.tenantId)
        .where("staffCode", staffCode)
        .where("revokedAt", "IS", null)
        .related("principal")
        .one();
    },
  ),
};

// ============================================================================
// CONFIG QUERIES - Restaurant settings (public read, tenant required)
// ============================================================================
const configQueries = {
  /**
   * Get restaurant settings
   * PUBLIC - anyone can read settings for their tenant
   * Returns null if no tenant context
   */
  settings: defineQuery(({ ctx }: { ctx: QueryContext }) => {
    if (!hasTenant(ctx)) {
      return zql.restaurantSettings.limit(0).one();
    }
    return zql.restaurantSettings.where("tenantId", ctx.tenantId).one();
  }),
};

// ============================================================================
// MENU QUERIES - Categories, items, allergens (public read, tenant required)
// ============================================================================
const menuQueries = {
  /**
   * All categories with their menu items
   * PUBLIC - menu browsing is public
   * Returns empty if no tenant context
   */
  categoriesWithItems: defineQuery(({ ctx }: { ctx: QueryContext }) => {
    if (!hasTenant(ctx)) {
      return zql.category.limit(0);
    }
    return zql.category
      .where("tenantId", ctx.tenantId)
      .related("menuItems", (q) => q.related("menuItem"));
  }),

  /**
   * All categories (simple list)
   * PUBLIC - menu browsing is public
   * Returns empty if no tenant context
   */
  categories: defineQuery(({ ctx }: { ctx: QueryContext }) => {
    if (!hasTenant(ctx)) {
      return zql.category.limit(0);
    }
    return zql.category.where("tenantId", ctx.tenantId);
  }),

  /**
   * All allergens
   * PUBLIC - allergen info is public for menu
   * Returns empty if no tenant context
   */
  allergens: defineQuery(({ ctx }: { ctx: QueryContext }) => {
    if (!hasTenant(ctx)) {
      return zql.allergen.limit(0);
    }
    return zql.allergen.where("tenantId", ctx.tenantId);
  }),

  /**
   * All menu items
   * PUBLIC - menu browsing is public
   * Returns empty if no tenant context
   */
  menuItems: defineQuery(({ ctx }: { ctx: QueryContext }) => {
    if (!hasTenant(ctx)) {
      return zql.menuItem.limit(0);
    }
    return zql.menuItem.where("tenantId", ctx.tenantId);
  }),
};

// ============================================================================
// TABLE QUERIES - Restaurant tables (STAFF/ADMIN only)
// ============================================================================
const tableQueries = {
  /**
   * All tables with full relations (tabs, items, payments)
   * STAFF/ADMIN - operational data
   * Returns empty if no tenant or insufficient role
   */
  allWithDetails: defineQuery(({ ctx }: { ctx: QueryContext }) => {
    if (!hasTenant(ctx) || !isStaffOrAdmin(ctx)) {
      return zql.restaurantTable.limit(0);
    }
    return zql.restaurantTable
      .where("tenantId", ctx.tenantId)
      .related("tabs", (q) =>
        q.related("items", (q) =>
          q
            .related("menuItem", (q) =>
              q.related("categories", (q) => q.related("category")),
            )
            .related("allergyRestrictions", (q) => q.related("allergen")),
        ),
      )
      .related("payments", (q) => q.related("tabItems"));
  }),

  /**
   * Single table by ID with full relations
   * STAFF/ADMIN - operational data
   * Returns null if no tenant or insufficient role
   */
  byId: defineQuery(
    z.object({ id: z.string() }),
    ({ args: { id }, ctx }: { args: { id: string }; ctx: QueryContext }) => {
      if (!hasTenant(ctx) || !isStaffOrAdmin(ctx)) {
        return zql.restaurantTable.limit(0).one();
      }
      return zql.restaurantTable
        .where("id", id)
        .where("tenantId", ctx.tenantId)
        .related("tabs", (q) =>
          q.related("items", (q) =>
            q
              .related("menuItem", (q) =>
                q.related("categories", (q) => q.related("category")),
              )
              .related("allergyRestrictions", (q) => q.related("allergen")),
          ),
        )
        .related("payments", (q) => q.related("tabItems"))
        .one();
    },
  ),

  /**
   * Get table with just tabs (for close-tab navigation)
   * STAFF/ADMIN - operational data
   * Returns null if no tenant or insufficient role
   */
  byIdWithTabs: defineQuery(
    z.object({ id: z.string() }),
    ({ args: { id }, ctx }: { args: { id: string }; ctx: QueryContext }) => {
      if (!hasTenant(ctx) || !isStaffOrAdmin(ctx)) {
        return zql.restaurantTable.limit(0).one();
      }
      return zql.restaurantTable
        .where("id", id)
        .where("tenantId", ctx.tenantId)
        .related("tabs")
        .one();
    },
  ),
};

// ============================================================================
// TAB QUERIES - Tabs and tab items (STAFF/ADMIN only)
// ============================================================================
const tabQueries = {
  /**
   * Get tabs by table ID that are not closed
   * STAFF/ADMIN - operational data
   * Returns empty if no tenant or insufficient role
   */
  openByTableId: defineQuery(
    z.object({ tableId: z.string() }),
    ({
      args: { tableId },
      ctx,
    }: {
      args: { tableId: string };
      ctx: QueryContext;
    }) => {
      if (!hasTenant(ctx) || !isStaffOrAdmin(ctx)) {
        return zql.tab.limit(0);
      }
      return zql.tab
        .where("tableID", tableId)
        .where("tenantId", ctx.tenantId)
        .where("closed", false);
    },
  ),

  /**
   * Get tabs by IDs with items and payments (for payment flow)
   * STAFF/ADMIN - operational data
   * Returns empty if no tenant or insufficient role
   */
  byIdsWithItems: defineQuery(
    z.object({ ids: z.array(z.string()) }),
    ({
      args: { ids },
      ctx,
    }: {
      args: { ids: string[] };
      ctx: QueryContext;
    }) => {
      if (!hasTenant(ctx) || !isStaffOrAdmin(ctx)) {
        return zql.tab.limit(0);
      }
      return zql.tab
        .where("id", "IN", ids)
        .where("tenantId", ctx.tenantId)
        .related("items", (q) => q.related("payments"));
    },
  ),
};

// ============================================================================
// KITCHEN QUERIES - Tab items for kitchen view (STAFF/ADMIN only)
// ============================================================================
const kitchenQueries = {
  /**
   * Items that are prepping (not ready, not served)
   * STAFF/ADMIN - operational data
   * Returns empty if no tenant or insufficient role
   */
  preppingItems: defineQuery(({ ctx }: { ctx: QueryContext }) => {
    if (!hasTenant(ctx) || !isStaffOrAdmin(ctx)) {
      return zql.tabItem.limit(0);
    }
    return zql.tabItem
      .where("tenantId", ctx.tenantId)
      .where(({ cmp, and }) =>
        and(cmp("readyAt", "IS", null), cmp("servedAt", "IS", null)),
      );
  }),

  /**
   * Items that are ready (ready but not served)
   * STAFF/ADMIN - operational data
   * Returns empty if no tenant or insufficient role
   */
  readyItems: defineQuery(({ ctx }: { ctx: QueryContext }) => {
    if (!hasTenant(ctx) || !isStaffOrAdmin(ctx)) {
      return zql.tabItem.limit(0);
    }
    return zql.tabItem
      .where("tenantId", ctx.tenantId)
      .where(({ cmp, and, not }) =>
        and(not(cmp("readyAt", "IS", null)), cmp("servedAt", "IS", null)),
      );
  }),

  /**
   * Items filtered by prep/serve mode with full relations
   * STAFF/ADMIN - operational data
   * Returns empty if no tenant or insufficient role
   */
  itemsByMode: defineQuery(
    z.object({ prepMode: z.boolean() }),
    ({
      args: { prepMode },
      ctx,
    }: {
      args: { prepMode: boolean };
      ctx: QueryContext;
    }) => {
      if (!hasTenant(ctx) || !isStaffOrAdmin(ctx)) {
        return zql.tabItem.limit(0);
      }
      return zql.tabItem
        .where("tenantId", ctx.tenantId)
        .where(({ cmp, and, not }) => {
          if (prepMode) {
            return and(cmp("readyAt", "IS", null), cmp("servedAt", "IS", null));
          } else {
            return and(
              not(cmp("readyAt", "IS", null)),
              cmp("servedAt", "IS", null),
            );
          }
        })
        .related("tab", (q) => q.related("table"))
        .related("menuItem", (q) =>
          q.related("categories", (q) => q.related("category")),
        )
        .related("allergyRestrictions", (q) => q.related("allergen"));
    },
  ),

  /**
   * All items for category counts (filtered by mode)
   * STAFF/ADMIN - operational data
   * Returns empty if no tenant or insufficient role
   */
  itemsForCategoryCounts: defineQuery(
    z.object({ prepMode: z.boolean() }),
    ({
      args: { prepMode },
      ctx,
    }: {
      args: { prepMode: boolean };
      ctx: QueryContext;
    }) => {
      if (!hasTenant(ctx) || !isStaffOrAdmin(ctx)) {
        return zql.tabItem.limit(0);
      }
      return zql.tabItem
        .where("tenantId", ctx.tenantId)
        .where(({ cmp, and, not }) => {
          if (prepMode) {
            return and(cmp("readyAt", "IS", null), cmp("servedAt", "IS", null));
          } else {
            return and(
              not(cmp("readyAt", "IS", null)),
              cmp("servedAt", "IS", null),
            );
          }
        })
        .related("menuItem", (q) =>
          q.related("categories", (q) => q.related("category")),
        );
    },
  ),
};

// ============================================================================
// PLATFORM QUERIES - Cross-tenant access for platform admins
// ============================================================================
const platformQueries = {
  /**
   * List all tenants with basic info
   * PLATFORM ADMIN ONLY
   * Returns empty if not platform admin
   */
  tenants: defineQuery(({ ctx }: { ctx: QueryContext }) => {
    if (!isPlatformAdmin(ctx)) {
      return zql.tenant.limit(0);
    }
    return zql.tenant.related("restaurantSettings");
  }),

  /**
   * Get single tenant with details
   * PLATFORM ADMIN ONLY
   * Returns null if not platform admin
   */
  tenantById: defineQuery(
    z.object({ id: z.string() }),
    ({ args: { id }, ctx }: { args: { id: string }; ctx: QueryContext }) => {
      if (!isPlatformAdmin(ctx)) {
        return zql.tenant.limit(0).one();
      }
      return zql.tenant.where("id", id).related("restaurantSettings").one();
    },
  ),

  /**
   * Get principals with PIN credentials for a specific tenant (staff members)
   * PLATFORM ADMIN ONLY
   * Returns empty if not platform admin
   */
  tenantStaff: defineQuery(
    z.object({ tenantId: z.string() }),
    ({
      args: { tenantId },
      ctx,
    }: {
      args: { tenantId: string };
      ctx: QueryContext;
    }) => {
      if (!isPlatformAdmin(ctx)) {
        return zql.pinCredential.limit(0);
      }
      return zql.pinCredential.where("tenantId", tenantId).related("principal");
    },
  ),
};

// ============================================================================
// EXPORT QUERY REGISTRY
// ============================================================================
export const queries = defineQueries({
  principals: principalQueries,
  login: loginQueries,
  config: configQueries,
  menu: menuQueries,
  tables: tableQueries,
  tabs: tabQueries,
  kitchen: kitchenQueries,
  platform: platformQueries,
});

export type Queries = typeof queries;
