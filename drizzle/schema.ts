import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

// ============================================================================
// Identity & Access Tables
// ============================================================================

// Principal - The canonical "who or what" in the system
export const principal = pgTable("principal", {
  id: varchar("id").primaryKey(),
  kind: varchar("kind").notNull(), // "human" | "machine"
  displayName: varchar("displayName").notNull(),
  avatarUrl: varchar("avatarUrl"),
  globalCredVersion: integer("globalCredVersion").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull(),
});

// PIN Credential - Tenant-scoped, fast auth for floor staff
export const pinCredential = pgTable(
  "pin_credential",
  {
    id: varchar("id").primaryKey(),
    principalId: varchar("principalId").notNull(),
    tenantId: varchar("tenantId").notNull(),
    staffCode: varchar("staffCode", { length: 3 }).notNull(),
    pinHash: varchar("pinHash").notNull(),
    pinSalt: varchar("pinSalt").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull(),
    revokedAt: timestamp("revokedAt", { mode: "date" }),
  },
  (table) => [
    index("pin_credential_principalId_idx").on(table.principalId),
    uniqueIndex("pin_credential_tenant_staffCode_idx").on(
      table.tenantId,
      table.staffCode,
    ),
  ],
);

// Password Credential - Global email/password auth
export const passwordCredential = pgTable(
  "password_credential",
  {
    id: varchar("id").primaryKey(),
    principalId: varchar("principalId").notNull(),
    email: varchar("email").notNull(),
    passwordHash: varchar("passwordHash").notNull(),
    passwordSalt: varchar("passwordSalt").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull(),
    revokedAt: timestamp("revokedAt", { mode: "date" }),
  },
  (table) => [
    index("password_credential_principalId_idx").on(table.principalId),
    uniqueIndex("password_credential_email_idx").on(table.email),
  ],
);

// OAuth Credential - Global OAuth provider auth
export const oauthCredential = pgTable(
  "oauth_credential",
  {
    id: varchar("id").primaryKey(),
    principalId: varchar("principalId").notNull(),
    provider: varchar("provider").notNull(), // "google" | "github" | "facebook"
    providerId: varchar("providerId").notNull(),
    email: varchar("email"),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull(),
    revokedAt: timestamp("revokedAt", { mode: "date" }),
    lastUsedAt: timestamp("lastUsedAt", { mode: "date" }),
  },
  (table) => [
    index("oauth_credential_principalId_idx").on(table.principalId),
    uniqueIndex("oauth_credential_provider_providerId_idx").on(
      table.provider,
      table.providerId,
    ),
  ],
);

// API Key Credential - For machine actors
export const apiKeyCredential = pgTable(
  "api_key_credential",
  {
    id: varchar("id").primaryKey(),
    principalId: varchar("principalId").notNull(),
    name: varchar("name").notNull(),
    keyHash: varchar("keyHash").notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull(),
    revokedAt: timestamp("revokedAt", { mode: "date" }),
    lastUsedAt: timestamp("lastUsedAt", { mode: "date" }),
  },
  (table) => [
    index("api_key_credential_principalId_idx").on(table.principalId),
  ],
);

// Role Grant - Binds a Principal to a Scope with specific permissions
export const roleGrant = pgTable(
  "role_grant",
  {
    id: varchar("id").primaryKey(),
    principalId: varchar("principalId").notNull(),
    scopeKind: varchar("scopeKind").notNull(), // "platform" | "tenant"
    tenantId: varchar("tenantId"), // null if scopeKind=platform
    role: varchar("role").notNull(), // "staff" | "manager" | "admin" | "platform_admin" | "service_account"
    grantedAt: timestamp("grantedAt", { mode: "date" }).notNull(),
    revokedAt: timestamp("revokedAt", { mode: "date" }),
    grantedByPrincipalId: varchar("grantedByPrincipalId"),
  },
  (table) => [
    index("role_grant_principalId_idx").on(table.principalId),
    index("role_grant_tenantId_idx").on(table.tenantId),
    index("role_grant_scopeKind_tenantId_idx").on(
      table.scopeKind,
      table.tenantId,
    ),
  ],
);

// ============================================================================
// Domain Tables
// ============================================================================

// Tenant
export const tenant = pgTable(
  "tenant",
  {
    id: varchar("id").primaryKey(),
    name: varchar("name").notNull(),
    slug: varchar("slug", { length: 63 }).notNull().unique(), // URL-safe subdomain: lowercase, no spaces, alphanumeric + hyphens
    createdAt: timestamp("createdAt", { mode: "date" }).notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull(),
  },
  (table) => [uniqueIndex("tenant_slug_idx").on(table.slug)],
);

// Restaurant Settings
export const restaurantSettings = pgTable("restaurant_settings", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  currencyCode: varchar("currencyCode").notNull(),
  currencyLocale: varchar("currencyLocale").notNull(),
  primaryColor: varchar("primaryColor").notNull(),
  secondaryColor: varchar("secondaryColor").notNull(),
  timeZone: varchar("timeZone").notNull(),
  coinsAndNotes: varchar("coinsAndNotes").notNull(),
  tenantId: varchar("tenantId").notNull().unique(),
});

// Restaurant Table
export const restaurantTable = pgTable(
  "restaurant_table",
  {
    id: varchar("id").primaryKey(),
    name: varchar("name").notNull(),
    seats: integer("seats").notNull(),
    closed: boolean("closed"),
    closedAt: timestamp("closedAt", { mode: "date" }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull(),
    notes: varchar("notes"),
    tenantId: varchar("tenantId").notNull(),
    createdById: varchar("createdById").notNull(),
    closedById: varchar("closedById"),
  },
  (table) => [index("restaurant_table_tenantId_idx").on(table.tenantId)],
);

// Category
export const category = pgTable(
  "category",
  {
    id: varchar("id").primaryKey(),
    name: varchar("name").notNull(),
    icon: varchar("icon"),
    tenantId: varchar("tenantId").notNull(),
  },
  (table) => [index("category_tenantId_idx").on(table.tenantId)],
);

// Allergen
export const allergen = pgTable(
  "allergen",
  {
    id: varchar("id").primaryKey(),
    name: varchar("name").notNull(),
    icon: varchar("icon"),
    tenantId: varchar("tenantId").notNull(),
  },
  (table) => [index("allergen_tenantId_idx").on(table.tenantId)],
);

// Menu Item
export const menuItem = pgTable(
  "menu_item",
  {
    id: varchar("id").primaryKey(),
    name: varchar("name").notNull(),
    price: bigint("price", { mode: "number" }).notNull(),
    createdByID: varchar("createdByID"),
    tenantId: varchar("tenantId").notNull(),
  },
  (table) => [index("menu_item_tenantId_idx").on(table.tenantId)],
);

// Menu Item Category (junction table)
export const menuItemCategory = pgTable(
  "menu_item_category",
  {
    menuItemID: varchar("menuItemID").notNull(),
    categoryID: varchar("categoryID").notNull(),
  },
  (table) => [primaryKey({ columns: [table.menuItemID, table.categoryID] })],
);

// Menu Item Allergen (junction table)
export const menuItemAllergen = pgTable(
  "menu_item_allergen",
  {
    allergenID: varchar("allergenID").notNull(),
    menuItemID: varchar("menuItemID").notNull(),
  },
  (table) => [primaryKey({ columns: [table.menuItemID, table.allergenID] })],
);

// Tab
export const tab = pgTable(
  "tab",
  {
    id: varchar("id").primaryKey(),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull(),
    locked: boolean("locked"),
    closed: boolean("closed"),
    closedAt: timestamp("closedAt", { mode: "date" }),
    tableID: varchar("tableID"),
    tenantId: varchar("tenantId").notNull(),
    createdByID: varchar("createdByID"),
    closedByID: varchar("closedByID"),
  },
  (table) => [index("tab_tenantId_idx").on(table.tenantId)],
);

// Tab Item
export const tabItem = pgTable(
  "tab_item",
  {
    id: varchar("id").primaryKey(),
    notes: varchar("notes"),
    nameOverride: varchar("nameOverride"),
    priceOverride: bigint("priceOverride", { mode: "number" }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull(),
    readyAt: timestamp("readyAt", { mode: "date" }),
    servedAt: timestamp("servedAt", { mode: "date" }),
    tabID: varchar("tabID").notNull(),
    menuItemID: varchar("menuItemID"),
    createdByID: varchar("createdByID"),
    tenantId: varchar("tenantId").notNull(),
  },
  (table) => [index("tab_item_tenantId_idx").on(table.tenantId)],
);

// Tab Item Allergy Restriction (junction table)
export const tabItemAllergyRestriction = pgTable(
  "tab_item_allergy_restriction",
  {
    tabItemID: varchar("tabItemID").notNull(),
    allergenID: varchar("allergenID").notNull(),
  },
  (table) => [primaryKey({ columns: [table.tabItemID, table.allergenID] })],
);

// Payment
export const payment = pgTable(
  "payment",
  {
    id: varchar("id").primaryKey(),
    amount: bigint("amount", { mode: "number" }).notNull(),
    notes: varchar("notes"),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull(),
    tenantId: varchar("tenantId").notNull(),
    createdByID: varchar("createdByID").notNull(),
    tableID: varchar("tableID").notNull(),
  },
  (table) => [index("payment_tenantId_idx").on(table.tenantId)],
);

// Payment Tab Item Paid (junction table)
export const paymentTabItemPaid = pgTable(
  "payment_tab_item_paid",
  {
    paymentID: varchar("paymentID").notNull(),
    tabItemID: varchar("tabItemID").notNull(),
  },
  (table) => [primaryKey({ columns: [table.paymentID, table.tabItemID] })],
);

// ============================================================================
// Relations
// ============================================================================

// Principal relations
export const principalRelations = relations(principal, ({ many }) => ({
  pinCredentials: many(pinCredential),
  passwordCredentials: many(passwordCredential),
  oauthCredentials: many(oauthCredential),
  apiKeyCredentials: many(apiKeyCredential),
  roleGrants: many(roleGrant),
  grantedRoles: many(roleGrant, { relationName: "grantedBy" }),
  createdMenuItems: many(menuItem, { relationName: "menuItem_createdBy" }),
  createdTabs: many(tab, { relationName: "tab_createdBy" }),
  closedTabs: many(tab, { relationName: "tab_closedBy" }),
  createdRestaurantTables: many(restaurantTable, {
    relationName: "restaurant_table_createdBy",
  }),
  closedRestaurantTables: many(restaurantTable, {
    relationName: "restaurant_table_closedBy",
  }),
  createdPayments: many(payment, { relationName: "payment_createdBy" }),
}));

// PIN Credential relations
export const pinCredentialRelations = relations(pinCredential, ({ one }) => ({
  principal: one(principal, {
    fields: [pinCredential.principalId],
    references: [principal.id],
  }),
  tenant: one(tenant, {
    fields: [pinCredential.tenantId],
    references: [tenant.id],
  }),
}));

// Password Credential relations
export const passwordCredentialRelations = relations(
  passwordCredential,
  ({ one }) => ({
    principal: one(principal, {
      fields: [passwordCredential.principalId],
      references: [principal.id],
    }),
  }),
);

// OAuth Credential relations
export const oauthCredentialRelations = relations(
  oauthCredential,
  ({ one }) => ({
    principal: one(principal, {
      fields: [oauthCredential.principalId],
      references: [principal.id],
    }),
  }),
);

// API Key Credential relations
export const apiKeyCredentialRelations = relations(
  apiKeyCredential,
  ({ one }) => ({
    principal: one(principal, {
      fields: [apiKeyCredential.principalId],
      references: [principal.id],
    }),
  }),
);

// Role Grant relations
export const roleGrantRelations = relations(roleGrant, ({ one }) => ({
  principal: one(principal, {
    fields: [roleGrant.principalId],
    references: [principal.id],
  }),
  tenant: one(tenant, {
    fields: [roleGrant.tenantId],
    references: [tenant.id],
  }),
  grantedBy: one(principal, {
    fields: [roleGrant.grantedByPrincipalId],
    references: [principal.id],
    relationName: "grantedBy",
  }),
}));

// Tenant relations
export const tenantRelations = relations(tenant, ({ one, many }) => ({
  restaurantSettings: one(restaurantSettings, {
    fields: [tenant.id],
    references: [restaurantSettings.tenantId],
  }),
  pinCredentials: many(pinCredential),
  roleGrants: many(roleGrant),
  restaurantTables: many(restaurantTable),
  categories: many(category),
  allergens: many(allergen),
  menuItems: many(menuItem),
  tabs: many(tab),
  tabItems: many(tabItem),
  payments: many(payment),
}));

// Restaurant Settings relations
export const restaurantSettingsRelations = relations(
  restaurantSettings,
  ({ one }) => ({
    tenant: one(tenant, {
      fields: [restaurantSettings.tenantId],
      references: [tenant.id],
    }),
  }),
);

// Restaurant Table relations
export const restaurantTableRelations = relations(
  restaurantTable,
  ({ one, many }) => ({
    tenant: one(tenant, {
      fields: [restaurantTable.tenantId],
      references: [tenant.id],
    }),
    createdBy: one(principal, {
      fields: [restaurantTable.createdById],
      references: [principal.id],
      relationName: "restaurant_table_createdBy",
    }),
    closedBy: one(principal, {
      fields: [restaurantTable.closedById],
      references: [principal.id],
      relationName: "restaurant_table_closedBy",
    }),
    tabs: many(tab, { relationName: "tab_table" }),
    payments: many(payment, { relationName: "payment_table" }),
  }),
);

// Category relations
export const categoryRelations = relations(category, ({ one, many }) => ({
  tenant: one(tenant, {
    fields: [category.tenantId],
    references: [tenant.id],
  }),
  menuItems: many(menuItemCategory),
}));

// Allergen relations
export const allergenRelations = relations(allergen, ({ one, many }) => ({
  tenant: one(tenant, {
    fields: [allergen.tenantId],
    references: [tenant.id],
  }),
  menuItems: many(menuItemAllergen),
  tabItemRestrictions: many(tabItemAllergyRestriction),
}));

// Menu Item relations
export const menuItemRelations = relations(menuItem, ({ one, many }) => ({
  tenant: one(tenant, {
    fields: [menuItem.tenantId],
    references: [tenant.id],
  }),
  createdBy: one(principal, {
    fields: [menuItem.createdByID],
    references: [principal.id],
    relationName: "menuItem_createdBy",
  }),
  categories: many(menuItemCategory),
  allergens: many(menuItemAllergen),
  tabItems: many(tabItem),
}));

// Menu Item Category relations
export const menuItemCategoryRelations = relations(
  menuItemCategory,
  ({ one }) => ({
    menuItem: one(menuItem, {
      fields: [menuItemCategory.menuItemID],
      references: [menuItem.id],
    }),
    category: one(category, {
      fields: [menuItemCategory.categoryID],
      references: [category.id],
    }),
  }),
);

// Menu Item Allergen relations
export const menuItemAllergenRelations = relations(
  menuItemAllergen,
  ({ one }) => ({
    menuItem: one(menuItem, {
      fields: [menuItemAllergen.menuItemID],
      references: [menuItem.id],
    }),
    allergen: one(allergen, {
      fields: [menuItemAllergen.allergenID],
      references: [allergen.id],
    }),
  }),
);

// Tab relations
export const tabRelations = relations(tab, ({ one, many }) => ({
  tenant: one(tenant, {
    fields: [tab.tenantId],
    references: [tenant.id],
  }),
  createdBy: one(principal, {
    fields: [tab.createdByID],
    references: [principal.id],
    relationName: "tab_createdBy",
  }),
  closedBy: one(principal, {
    fields: [tab.closedByID],
    references: [principal.id],
    relationName: "tab_closedBy",
  }),
  table: one(restaurantTable, {
    fields: [tab.tableID],
    references: [restaurantTable.id],
    relationName: "tab_table",
  }),
  items: many(tabItem),
}));

// Tab Item relations
export const tabItemRelations = relations(tabItem, ({ one, many }) => ({
  tenant: one(tenant, {
    fields: [tabItem.tenantId],
    references: [tenant.id],
  }),
  tab: one(tab, {
    fields: [tabItem.tabID],
    references: [tab.id],
  }),
  menuItem: one(menuItem, {
    fields: [tabItem.menuItemID],
    references: [menuItem.id],
  }),
  createdBy: one(principal, {
    fields: [tabItem.createdByID],
    references: [principal.id],
  }),
  allergyRestrictions: many(tabItemAllergyRestriction),
  payments: many(paymentTabItemPaid),
}));

// Tab Item Allergy Restriction relations
export const tabItemAllergyRestrictionRelations = relations(
  tabItemAllergyRestriction,
  ({ one }) => ({
    tabItem: one(tabItem, {
      fields: [tabItemAllergyRestriction.tabItemID],
      references: [tabItem.id],
    }),
    allergen: one(allergen, {
      fields: [tabItemAllergyRestriction.allergenID],
      references: [allergen.id],
    }),
  }),
);

// Payment relations
export const paymentRelations = relations(payment, ({ one, many }) => ({
  tenant: one(tenant, {
    fields: [payment.tenantId],
    references: [tenant.id],
  }),
  createdBy: one(principal, {
    fields: [payment.createdByID],
    references: [principal.id],
    relationName: "payment_createdBy",
  }),
  table: one(restaurantTable, {
    fields: [payment.tableID],
    references: [restaurantTable.id],
    relationName: "payment_table",
  }),
  tabItems: many(paymentTabItemPaid),
}));

// Payment Tab Item Paid relations
export const paymentTabItemPaidRelations = relations(
  paymentTabItemPaid,
  ({ one }) => ({
    payment: one(payment, {
      fields: [paymentTabItemPaid.paymentID],
      references: [payment.id],
    }),
    tabItem: one(tabItem, {
      fields: [paymentTabItemPaid.tabItemID],
      references: [tabItem.id],
    }),
  }),
);
