/**
 * Zero v0.25 Mutator Definitions
 *
 * All mutators are defined here with auth context for permissions.
 * Permissions are enforced via ctx (from JWT) on both client and server.
 *
 * Permission model:
 * - Staff/Admin: All operational mutations (tables, tabs, tab items, payments)
 * - Tenant isolation: All mutations include tenantId from context
 *
 * Usage in components:
 *   zero.mutate(mutators.tabItem.markReady({ id: itemId }))
 *   zero.mutate(mutators.restaurantTable.close({ id: tableId }))
 */
import {
  defineMutator,
  defineMutators,
  type Transaction,
} from "@rocicorp/zero";
import { DateTime } from "luxon";
import { z } from "zod";
import { type Schema, zql } from "@/zero/schema.gen";
import type { ZeroContext } from "@/zero/types";
import { generateId, isId } from "./utils/ids";
// Import for module augmentation side-effect
import "@/zero/types";

// Transaction type alias for cleaner signatures
type Tx = Transaction<Schema>;

// Re-export for backwards compatibility
export type MutatorContext = ZeroContext;

// ============================================================================
// PERMISSION HELPERS
// ============================================================================
// SECURITY: The JWT contains tenantId + role. A user's role is ALWAYS
// tenant-specific - i.e., being "staff" for tenant A does NOT grant access
// to tenant B. The JWT is issued per-tenant during login.
//
// These helpers enforce that:
// 1. User has a valid tenant context (from JWT)
// 2. User has the required role FOR that tenant (from JWT)
// 3. Both must be present - you can't have a role without a tenant
// ============================================================================

const requireTenantAuth = (
  ctx: MutatorContext,
): { userID: string; tenantId: string } => {
  if (!ctx.tenantId) {
    throw new Error("Access denied: tenant context required");
  }
  if (!ctx.userID) {
    throw new Error("Access denied: authentication required");
  }
  return { userID: ctx.userID, tenantId: ctx.tenantId };
};

const requireStaffOrAdminForTenant = (
  ctx: MutatorContext,
): { userID: string; tenantId: string } => {
  // First verify tenant + auth
  const { userID, tenantId } = requireTenantAuth(ctx);

  // Then verify role (which is tenant-specific in the JWT)
  // Platform admins can also perform staff/admin operations
  if (ctx.role !== "admin" && ctx.role !== "staff" && ctx.role !== "platform") {
    throw new Error(
      "Access denied: staff or admin role required for this tenant",
    );
  }

  return { userID, tenantId };
};

// ============================================================================
// RESTAURANT TABLE MUTATORS
// ============================================================================
// Zod schemas for reuse
const tableInsertSchema = z.object({
  id: z.string(),
  name: z.string(),
  seats: z.number(),
  notes: z.string().nullable().optional(),
});

const tableUpdateSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  seats: z.number().optional(),
  notes: z.string().nullable().optional(),
  closed: z.boolean().optional(),
});

const restaurantTableMutators = {
  insert: defineMutator(
    tableInsertSchema,
    async ({
      tx,
      args,
      ctx,
    }: {
      tx: Tx;
      args: z.infer<typeof tableInsertSchema>;
      ctx: MutatorContext;
    }) => {
      const { userID, tenantId } = requireStaffOrAdminForTenant(ctx);

      if (!isId("table", args.id)) {
        throw new Error("Invalid table id");
      }

      await tx.mutate.restaurantTable.insert({
        id: args.id,
        name: args.name,
        seats: args.seats,
        notes: args.notes ?? null,
        closed: false,
        createdAt: DateTime.now().toMillis(),
        createdById: userID,
        tenantId,
      });
    },
  ),

  update: defineMutator(
    tableUpdateSchema,
    async ({
      tx,
      args,
      ctx,
    }: {
      tx: Tx;
      args: z.infer<typeof tableUpdateSchema>;
      ctx: MutatorContext;
    }) => {
      const { userID } = requireStaffOrAdminForTenant(ctx);

      // If closing table, verify no open tabs
      if (args.closed && tx.location === "server") {
        const openTabs = await tx.run(
          zql.tab.where("tableID", args.id).where("closed", false),
        );
        if (openTabs.length > 0) {
          throw new Error("Cannot close table with open tabs");
        }
      }

      await tx.mutate.restaurantTable.update({
        id: args.id,
        ...(args.name !== undefined && { name: args.name }),
        ...(args.seats !== undefined && { seats: args.seats }),
        ...(args.notes !== undefined && { notes: args.notes }),
        ...(args.closed !== undefined && {
          closed: args.closed,
          closedAt: args.closed ? DateTime.now().toMillis() : null,
          closedById: args.closed ? userID : null,
        }),
      });
    },
  ),

  /**
   * Close a table - automatically closes all open tabs first
   * Business logic: All tabs must be closeable (no unpaid items check happens in tab.update)
   */
  close: defineMutator(
    z.object({ id: z.string() }),
    async ({
      tx,
      args,
      ctx,
    }: {
      tx: Tx;
      args: { id: string };
      ctx: MutatorContext;
    }) => {
      const { userID } = requireStaffOrAdminForTenant(ctx);

      // Get all open tabs for this table
      const openTabs = await tx.run(
        zql.tab.where("tableID", args.id).where("closed", false),
      );

      // Close all open tabs
      for (const tab of openTabs) {
        await tx.mutate.tab.update({
          id: tab.id,
          closed: true,
          closedAt: DateTime.now().toMillis(),
          closedByID: userID,
        });
      }

      // Close the table
      await tx.mutate.restaurantTable.update({
        id: args.id,
        closed: true,
        closedAt: DateTime.now().toMillis(),
        closedById: userID,
      });
    },
  ),
};

// ============================================================================
// TAB MUTATORS
// ============================================================================
const tabInsertSchema = z.object({
  id: z.string(),
  tableID: z.string(),
});

const tabUpdateSchema = z.object({
  id: z.string(),
  closed: z.boolean().optional(),
  locked: z.boolean().optional(),
});

const tabMutators = {
  insert: defineMutator(
    tabInsertSchema,
    async ({
      tx,
      args,
      ctx,
    }: {
      tx: Tx;
      args: z.infer<typeof tabInsertSchema>;
      ctx: MutatorContext;
    }) => {
      const { userID, tenantId } = requireStaffOrAdminForTenant(ctx);

      if (!isId("tab", args.id)) {
        throw new Error("Invalid tab id");
      }

      await tx.mutate.tab.insert({
        id: args.id,
        tableID: args.tableID,
        closed: false,
        locked: false,
        createdAt: DateTime.now().toMillis(),
        createdByID: userID,
        tenantId,
      });
    },
  ),

  update: defineMutator(
    tabUpdateSchema,
    async ({
      tx,
      args,
      ctx,
    }: {
      tx: Tx;
      args: z.infer<typeof tabUpdateSchema>;
      ctx: MutatorContext;
    }) => {
      const { userID } = requireStaffOrAdminForTenant(ctx);

      // If closing tab with no items, delete it instead
      if (args.closed && tx.location === "server") {
        const tab = await tx.run(
          zql.tab.where("id", args.id).related("items").one(),
        );
        if (tab?.items?.length === 0) {
          await tx.mutate.tab.delete({ id: args.id });
          return;
        }
      }

      await tx.mutate.tab.update({
        id: args.id,
        ...(args.locked !== undefined && { locked: args.locked }),
        ...(args.closed !== undefined && {
          closed: args.closed,
          closedAt: args.closed ? DateTime.now().toMillis() : null,
          closedByID: args.closed ? userID : null,
        }),
      });
    },
  ),
};

// ============================================================================
// TAB ITEM MUTATORS
// ============================================================================
const tabItemInsertSchema = z.object({
  id: z.string(),
  tabID: z.string(),
  menuItemID: z.string().nullable().optional(),
  nameOverride: z.string().nullable().optional(),
  priceOverride: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const tabItemUpdateSchema = z.object({
  id: z.string(),
  readyAt: z.number().nullable().optional(),
  servedAt: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const tabItemBatchInsertSchema = z.object({
  tabID: z.string(),
  items: z.array(
    z.object({
      menuItemID: z.string().nullable().optional(),
      nameOverride: z.string().nullable().optional(),
      priceOverride: z.number().nullable().optional(),
      notes: z.string().nullable().optional(),
    }),
  ),
});

const tabItemBatchStatusSchema = z.object({
  ids: z.array(z.string()),
  status: z.enum(["ready", "served", "reset"]),
});

const tabItemMutators = {
  insert: defineMutator(
    tabItemInsertSchema,
    async ({
      tx,
      args,
      ctx,
    }: {
      tx: Tx;
      args: z.infer<typeof tabItemInsertSchema>;
      ctx: MutatorContext;
    }) => {
      const { userID, tenantId } = requireStaffOrAdminForTenant(ctx);

      if (!isId("tabItem", args.id)) {
        throw new Error("Invalid tab item id");
      }

      await tx.mutate.tabItem.insert({
        id: args.id,
        tabID: args.tabID,
        menuItemID: args.menuItemID ?? null,
        nameOverride: args.nameOverride ?? null,
        priceOverride: args.priceOverride ?? null,
        notes: args.notes ?? null,
        createdAt: DateTime.now().toMillis(),
        createdByID: userID,
        tenantId,
      });
    },
  ),

  update: defineMutator(
    tabItemUpdateSchema,
    async ({
      tx,
      args,
      ctx,
    }: {
      tx: Tx;
      args: z.infer<typeof tabItemUpdateSchema>;
      ctx: MutatorContext;
    }) => {
      requireStaffOrAdminForTenant(ctx);

      await tx.mutate.tabItem.update({
        id: args.id,
        ...(args.readyAt !== undefined && { readyAt: args.readyAt }),
        ...(args.servedAt !== undefined && { servedAt: args.servedAt }),
        ...(args.notes !== undefined && { notes: args.notes }),
      });
    },
  ),

  delete: defineMutator(
    z.object({ id: z.string() }),
    async ({
      tx,
      args,
      ctx,
    }: {
      tx: Tx;
      args: { id: string };
      ctx: MutatorContext;
    }) => {
      requireStaffOrAdminForTenant(ctx);
      await tx.mutate.tabItem.delete({ id: args.id });
    },
  ),

  // Convenience mutators for kitchen workflow
  markReady: defineMutator(
    z.object({ id: z.string() }),
    async ({
      tx,
      args,
      ctx,
    }: {
      tx: Tx;
      args: { id: string };
      ctx: MutatorContext;
    }) => {
      requireStaffOrAdminForTenant(ctx);
      await tx.mutate.tabItem.update({
        id: args.id,
        readyAt: DateTime.now().toMillis(),
      });
    },
  ),

  markServed: defineMutator(
    z.object({ id: z.string() }),
    async ({
      tx,
      args,
      ctx,
    }: {
      tx: Tx;
      args: { id: string };
      ctx: MutatorContext;
    }) => {
      requireStaffOrAdminForTenant(ctx);
      await tx.mutate.tabItem.update({
        id: args.id,
        servedAt: DateTime.now().toMillis(),
      });
    },
  ),

  resetStatus: defineMutator(
    z.object({ id: z.string() }),
    async ({
      tx,
      args,
      ctx,
    }: {
      tx: Tx;
      args: { id: string };
      ctx: MutatorContext;
    }) => {
      requireStaffOrAdminForTenant(ctx);
      await tx.mutate.tabItem.update({
        id: args.id,
        readyAt: null,
        servedAt: null,
      });
    },
  ),

  /**
   * Batch insert multiple tab items at once
   * Used when adding items from the menu to a tab
   */
  insertBatch: defineMutator(
    tabItemBatchInsertSchema,
    async ({
      tx,
      args,
      ctx,
    }: {
      tx: Tx;
      args: z.infer<typeof tabItemBatchInsertSchema>;
      ctx: MutatorContext;
    }) => {
      const { userID, tenantId } = requireStaffOrAdminForTenant(ctx);
      const now = DateTime.now().toMillis();

      for (const item of args.items) {
        const id = generateId("tabItem");
        await tx.mutate.tabItem.insert({
          id,
          tabID: args.tabID,
          menuItemID: item.menuItemID ?? null,
          nameOverride: item.nameOverride ?? null,
          priceOverride: item.priceOverride ?? null,
          notes: item.notes ?? null,
          createdAt: now,
          createdByID: userID,
          tenantId,
        });
      }
    },
  ),

  /**
   * Batch update status for multiple tab items (kitchen workflow)
   * Updates readyAt/servedAt for all items in one mutation
   */
  updateStatusBatch: defineMutator(
    tabItemBatchStatusSchema,
    async ({
      tx,
      args,
      ctx,
    }: {
      tx: Tx;
      args: z.infer<typeof tabItemBatchStatusSchema>;
      ctx: MutatorContext;
    }) => {
      requireStaffOrAdminForTenant(ctx);
      const now = DateTime.now().toMillis();

      for (const id of args.ids) {
        if (args.status === "ready") {
          await tx.mutate.tabItem.update({ id, readyAt: now });
        } else if (args.status === "served") {
          await tx.mutate.tabItem.update({ id, servedAt: now });
        } else if (args.status === "reset") {
          await tx.mutate.tabItem.update({ id, readyAt: null, servedAt: null });
        }
      }
    },
  ),
};

// ============================================================================
// PAYMENT MUTATORS
// ============================================================================
const paymentInsertSchema = z.object({
  id: z.string(),
  tableID: z.string(),
  amount: z.number(),
  notes: z.string().nullable().optional(),
});

const payItemsSchema = z.object({
  tableID: z.string(),
  amount: z.number(),
  tabItemIds: z.array(z.string()),
  notes: z.string().nullable().optional(),
});

const paymentMutators = {
  insert: defineMutator(
    paymentInsertSchema,
    async ({
      tx,
      args,
      ctx,
    }: {
      tx: Tx;
      args: z.infer<typeof paymentInsertSchema>;
      ctx: MutatorContext;
    }) => {
      const { userID, tenantId } = requireStaffOrAdminForTenant(ctx);

      if (!isId("payment", args.id)) {
        throw new Error("Invalid payment id");
      }

      await tx.mutate.payment.insert({
        id: args.id,
        tableID: args.tableID,
        amount: args.amount,
        notes: args.notes ?? null,
        createdAt: DateTime.now().toMillis(),
        createdByID: userID,
        tenantId,
      });
    },
  ),

  /**
   * Pay for specific items - creates payment, links to items, auto-closes fully paid tabs
   * This encapsulates the complete payment workflow in a single mutation
   */
  payItems: defineMutator(
    payItemsSchema,
    async ({
      tx,
      args,
      ctx,
    }: {
      tx: Tx;
      args: z.infer<typeof payItemsSchema>;
      ctx: MutatorContext;
    }) => {
      const { userID, tenantId } = requireStaffOrAdminForTenant(ctx);

      // Create the payment
      const paymentId = generateId("payment");
      await tx.mutate.payment.insert({
        id: paymentId,
        tableID: args.tableID,
        amount: args.amount,
        notes: args.notes ?? null,
        createdAt: DateTime.now().toMillis(),
        createdByID: userID,
        tenantId,
      });

      // Link payment to each tab item
      for (const tabItemID of args.tabItemIds) {
        await tx.mutate.paymentTabItemPaid.insert({
          paymentID: paymentId,
          tabItemID,
        });
      }

      // On server, check if any tabs are now fully paid and close them
      if (tx.location === "server") {
        // Get unique tab IDs from the paid items
        const tabItems = await tx.run(
          zql.tabItem.where("id", "IN", args.tabItemIds),
        );
        const tabIds = [
          ...new Set(
            tabItems
              .map((item) => item.tabID)
              .filter((id): id is string => id !== null),
          ),
        ];

        // Check each tab to see if all items are paid
        for (const tabId of tabIds) {
          const tab = await tx.run(
            zql.tab
              .where("id", tabId)
              .related("items", (q) => q.related("payments"))
              .one(),
          );

          if (tab && !tab.closed) {
            const allItemsPaid = tab.items.every(
              (item) => item.payments.length > 0,
            );
            if (allItemsPaid) {
              await tx.mutate.tab.update({
                id: tabId,
                closed: true,
                closedAt: DateTime.now().toMillis(),
                closedByID: userID,
              });
            }
          }
        }
      }
    },
  ),
};

// ============================================================================
// PAYMENT TAB ITEM PAID MUTATORS (junction table)
// ============================================================================
const paymentTabItemPaidInsertSchema = z.object({
  paymentID: z.string(),
  tabItemID: z.string(),
});

const paymentTabItemPaidMutators = {
  insert: defineMutator(
    paymentTabItemPaidInsertSchema,
    async ({
      tx,
      args,
      ctx,
    }: {
      tx: Tx;
      args: z.infer<typeof paymentTabItemPaidInsertSchema>;
      ctx: MutatorContext;
    }) => {
      requireStaffOrAdminForTenant(ctx);
      await tx.mutate.paymentTabItemPaid.insert({
        paymentID: args.paymentID,
        tabItemID: args.tabItemID,
      });
    },
  ),
};

// ============================================================================
// TENANT PROVISIONING MUTATORS (Platform Admin Only)
// ============================================================================

// Schema for allergen data
const allergenDataSchema = z.object({
  name: z.string(),
  icon: z.string().optional(),
});

// Schema for category data
const categoryDataSchema = z.object({
  name: z.string(),
  icon: z.string().optional(),
});

// Schema for menu item data
const menuItemDataSchema = z.object({
  name: z.string(),
  price: z.number(),
  categoryNames: z.array(z.string()).optional(),
  allergenNames: z.array(z.string()).optional(),
});

// Schema for admin staff data
const adminStaffDataSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  staffCode: z.string().default("001"),
  pin: z.string(), // Pre-hashed PIN
  email: z.string().optional(),
  password: z.string().optional(),
});

// Schema for restaurant settings
const restaurantSettingsDataSchema = z.object({
  name: z.string(),
  currencyCode: z.string(),
  currencyLocale: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  timeZone: z.string(),
  coinsAndNotes: z.string(),
});

// Main provision schema
const tenantProvisionSchema = z.object({
  tenantName: z.string(),
  settings: restaurantSettingsDataSchema,
  adminStaff: adminStaffDataSchema,
  allergens: z.array(allergenDataSchema).optional(),
  categories: z.array(categoryDataSchema).optional(),
  menuItems: z.array(menuItemDataSchema).optional(),
});

// Type alias for the provision args
type TenantProvisionArgs = z.infer<typeof tenantProvisionSchema>;

const tenantMutators = {
  /**
   * Provision a new tenant with all initial data
   * This is a server-only operation that creates:
   * - Tenant record
   * - Restaurant settings
   * - Admin staff with PIN and optional password login
   * - Allergens
   * - Categories
   * - Menu items with category and allergen associations
   */
  provision: defineMutator(
    tenantProvisionSchema,
    async ({
      tx,
      args,
      ctx,
    }: {
      tx: Tx;
      args: TenantProvisionArgs;
      ctx: MutatorContext;
    }) => {
      // This operation should only run on the server
      if (tx.location !== "server") {
        throw new Error("Tenant provisioning must run on the server");
      }

      // Platform admin check - must have platform role and no tenant context
      if (!ctx.userID) {
        throw new Error("Access denied: authentication required");
      }
      if (ctx.role !== "platform") {
        throw new Error("Access denied: platform admin role required");
      }

      const now = DateTime.now().toMillis();
      const tenantId = generateId("tenant");

      // 1. Create the tenant
      await tx.mutate.tenant.insert({
        id: tenantId,
        name: args.tenantName,
        createdAt: now,
        updatedAt: now,
      });

      // 2. Create restaurant settings
      await tx.mutate.restaurantSettings.insert({
        id: generateId("settings"),
        name: args.settings.name,
        currencyCode: args.settings.currencyCode,
        currencyLocale: args.settings.currencyLocale,
        primaryColor: args.settings.primaryColor,
        secondaryColor: args.settings.secondaryColor,
        timeZone: args.settings.timeZone,
        coinsAndNotes: args.settings.coinsAndNotes,
        tenantId,
      });

      // 3. Create principal (the canonical identity for admin)
      const principalId = generateId("principal");
      const displayName = `${args.adminStaff.firstName} ${args.adminStaff.lastName}`;
      await tx.mutate.principal.insert({
        id: principalId,
        kind: "human",
        displayName,
        globalCredVersion: 1,
        createdAt: now,
        updatedAt: now,
      });

      // 4. Create PIN credential for tenant-scoped login
      const pinCredentialId = generateId("pinCredential");
      await tx.mutate.pinCredential.insert({
        id: pinCredentialId,
        principalId,
        tenantId,
        staffCode: args.adminStaff.staffCode || "001",
        pinHash: args.adminStaff.pin, // Should be pre-hashed
        pinSalt: "", // Salt included in hash or provided separately
        createdAt: now,
      });

      // 5. Create password credential if email/password provided
      if (args.adminStaff.email && args.adminStaff.password) {
        const passwordCredentialId = generateId("passwordCredential");
        await tx.mutate.passwordCredential.insert({
          id: passwordCredentialId,
          principalId,
          email: args.adminStaff.email,
          passwordHash: args.adminStaff.password, // Should be pre-hashed
          passwordSalt: "", // Salt included in hash or provided separately
          createdAt: now,
        });
      }

      // 6. Create role grant (admin role for this tenant)
      const roleGrantId = generateId("roleGrant");
      await tx.mutate.roleGrant.insert({
        id: roleGrantId,
        principalId,
        scopeKind: "tenant",
        tenantId,
        role: "admin",
        grantedAt: now,
      });

      // 5. Create allergens
      const allergenIdMap: Record<string, string> = {};
      if (args.allergens) {
        for (const allergen of args.allergens) {
          const allergenId = generateId("allergen");
          allergenIdMap[allergen.name] = allergenId;
          await tx.mutate.allergen.insert({
            id: allergenId,
            name: allergen.name,
            icon: allergen.icon ?? null,
            tenantId,
          });
        }
      }

      // 6. Create categories
      const categoryIdMap: Record<string, string> = {};
      if (args.categories) {
        for (const category of args.categories) {
          const categoryId = generateId("category");
          categoryIdMap[category.name] = categoryId;
          await tx.mutate.category.insert({
            id: categoryId,
            name: category.name,
            icon: category.icon ?? null,
            tenantId,
          });
        }
      }

      // 7. Create menu items with associations
      if (args.menuItems) {
        for (const menuItem of args.menuItems) {
          const menuItemId = generateId("menuItem");
          await tx.mutate.menuItem.insert({
            id: menuItemId,
            name: menuItem.name,
            price: menuItem.price,
            createdByID: principalId,
            tenantId,
          });

          // Create category associations
          if (menuItem.categoryNames) {
            for (const categoryName of menuItem.categoryNames) {
              const categoryId = categoryIdMap[categoryName];
              if (categoryId) {
                await tx.mutate.menuItemCategory.insert({
                  menuItemID: menuItemId,
                  categoryID: categoryId,
                });
              }
            }
          }

          // Create allergen associations
          if (menuItem.allergenNames) {
            for (const allergenName of menuItem.allergenNames) {
              const allergenId = allergenIdMap[allergenName];
              if (allergenId) {
                await tx.mutate.menuItemAllergen.insert({
                  menuItemID: menuItemId,
                  allergenID: allergenId,
                });
              }
            }
          }
        }
      }
    },
  ),
};

// ============================================================================
// EXPORT MUTATOR REGISTRY
// ============================================================================
export const mutators = defineMutators({
  restaurantTable: restaurantTableMutators,
  tab: tabMutators,
  tabItem: tabItemMutators,
  payment: paymentMutators,
  paymentTabItemPaid: paymentTabItemPaidMutators,
  tenant: tenantMutators,
});

export type Mutators = typeof mutators;
