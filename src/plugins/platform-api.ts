import { Elysia, t } from "elysia";
import { nanoid } from "nanoid";
import { createHashAndSalt } from "../utils/auth";
import { sql } from "../utils/db";
import { type AuthPayload, authedPlugin } from "./auth";

/**
 * Platform API Plugin
 *
 * Provides API endpoints for platform-level operations like
 * tenant management. Uses shared auth infrastructure from auth.ts.
 */

// ID generators
const generateTenantId = () => `ten_${nanoid(16)}`;
const generateSettingsId = () => `set_${nanoid(16)}`;
const generatePrincipalId = () => `prin_${nanoid(16)}`;
const generateCredentialId = () => `cred_${nanoid(16)}`;
const generateRoleGrantId = () => `rg_${nanoid(16)}`;

// Type guard for platform auth
type PlatformAuthPayload = Extract<AuthPayload, { role: "platform" }>;
const isPlatformAuth = (
  auth: AuthPayload | null,
): auth is PlatformAuthPayload => auth?.role === "platform";

export const platformApiPlugin = new Elysia({ name: "platform-api" })
  // Use shared auth infrastructure
  .use(authedPlugin)
  // Derive platform-specific auth from the shared authPayload
  .derive(({ authPayload }) => {
    if (!isPlatformAuth(authPayload)) {
      return { platformAuth: null as PlatformAuthPayload | null };
    }
    return { platformAuth: authPayload };
  })
  .group("/api/platform", (app) =>
    app
      // List all tenants
      .get("/tenants", async ({ platformAuth, set }) => {
        if (!platformAuth) {
          set.status = 401;
          return { error: "Unauthorized" };
        }

        const tenants = (await sql`
          SELECT 
            t.id,
            t.name,
            EXTRACT(EPOCH FROM t."createdAt") * 1000 as "createdAt",
            (SELECT COUNT(*) FROM staff s WHERE s."tenantId" = t.id) as "staffCount",
            rs.name as "restaurantName"
          FROM tenant t
          LEFT JOIN restaurant_settings rs ON rs."tenantId" = t.id
          ORDER BY t."createdAt" DESC
        `) as Array<{
          id: string;
          name: string;
          createdAt: number;
          staffCount: number;
          restaurantName: string | null;
        }>;

        return {
          tenants: tenants.map((t) => ({
            id: t.id,
            name: t.name,
            createdAt: Number(t.createdAt),
            staffCount: Number(t.staffCount),
            restaurantName: t.restaurantName,
          })),
        };
      })

      // Get single tenant with details
      .get(
        "/tenants/:id",
        async ({ params, platformAuth, set }) => {
          if (!platformAuth) {
            set.status = 401;
            return { error: "Unauthorized" };
          }

          const { id } = params;

          const tenantRows = (await sql`
            SELECT 
              t.id,
              t.name,
              EXTRACT(EPOCH FROM t."createdAt") * 1000 as "createdAt",
              rs.name as "restaurantName"
            FROM tenant t
            LEFT JOIN restaurant_settings rs ON rs."tenantId" = t.id
            WHERE t.id = ${id}
            LIMIT 1
          `) as Array<{
            id: string;
            name: string;
            createdAt: number;
            restaurantName: string | null;
          }>;

          if (tenantRows.length === 0) {
            set.status = 404;
            return { error: "Tenant not found" };
          }

          const tenant = tenantRows[0];

          // Get staff list
          const staff = (await sql`
            SELECT 
              s.id,
              s."firstName",
              s."lastName",
              s."staffCode",
              (a.id IS NOT NULL) as "isAdmin"
            FROM staff s
            LEFT JOIN admin a ON a."staffId" = s.id
            WHERE s."tenantId" = ${id}
            ORDER BY s."firstName", s."lastName"
          `) as Array<{
            id: string;
            firstName: string;
            lastName: string;
            staffCode: string;
            isAdmin: boolean;
          }>;

          return {
            tenant: {
              id: tenant.id,
              name: tenant.name,
              createdAt: Number(tenant.createdAt),
              staffCount: staff.length,
              restaurantName: tenant.restaurantName,
              staff: staff.map((s) => ({
                id: s.id,
                firstName: s.firstName,
                lastName: s.lastName,
                staffCode: s.staffCode,
                isAdmin: s.isAdmin,
              })),
            },
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
        },
      )

      // Create a new tenant with initial setup
      .post(
        "/tenants",
        async ({ body, platformAuth, set }) => {
          if (!platformAuth) {
            set.status = 401;
            return { error: "Unauthorized" };
          }

          const { tenant, restaurant, admin } = body;

          try {
            // Generate IDs
            const tenantId = generateTenantId();
            const settingsId = generateSettingsId();
            const principalId = generatePrincipalId();
            const pinCredentialId = generateCredentialId();
            const passwordCredentialId = generateCredentialId();
            const roleGrantId = generateRoleGrantId();

            // Hash PIN and generate a default password
            const pinResult = await createHashAndSalt(admin.pin);
            const defaultPassword = nanoid(12);
            const passwordResult = await createHashAndSalt(defaultPassword);

            // Create tenant
            await sql`
              INSERT INTO tenant (id, name, "createdAt", "updatedAt")
              VALUES (${tenantId}, ${tenant.name}, NOW(), NOW())
            `;

            // Create restaurant settings
            await sql`
              INSERT INTO restaurant_settings (
                id, name, "currencyCode", "currencyLocale", 
                "primaryColor", "secondaryColor", "timeZone", "coinsAndNotes", "tenantId"
              )
              VALUES (
                ${settingsId}, ${restaurant.name}, ${restaurant.currencyCode || "EUR"}, 
                ${restaurant.currencyLocale || "en-GB"}, '#3b82f6', '#64748b', 
                'Europe/London', '[]', ${tenantId}
              )
            `;

            // Create principal (the canonical identity)
            const displayName = `${admin.firstName} ${admin.lastName}`;
            await sql`
              INSERT INTO principal (id, kind, "displayName", "globalCredVersion", "createdAt", "updatedAt")
              VALUES (${principalId}, 'human', ${displayName}, 1, NOW(), NOW())
            `;

            // Create PIN credential (for tenant-scoped login)
            await sql`
              INSERT INTO pin_credential (id, "principalId", "tenantId", "staffCode", "pinHash", "pinSalt", "createdAt")
              VALUES (${pinCredentialId}, ${principalId}, ${tenantId}, ${admin.staffCode}, ${pinResult.hash}, ${pinResult.salt}, NOW())
            `;

            // Create password credential (for global login)
            await sql`
              INSERT INTO password_credential (id, "principalId", email, "passwordHash", "passwordSalt", "createdAt")
              VALUES (${passwordCredentialId}, ${principalId}, ${admin.email}, ${passwordResult.hash}, ${passwordResult.salt}, NOW())
            `;

            // Create role grant (admin role for this tenant)
            await sql`
              INSERT INTO role_grant (id, "principalId", "scopeKind", "tenantId", role, "grantedAt")
              VALUES (${roleGrantId}, ${principalId}, 'tenant', ${tenantId}, 'admin', NOW())
            `;

            return {
              success: true,
              tenant: {
                id: tenantId,
                name: tenant.name,
                slug: tenant.slug,
              },
              admin: {
                email: admin.email,
                temporaryPassword: defaultPassword, // Send to admin email in production
              },
            };
          } catch (err) {
            console.error("Failed to create tenant:", err);
            set.status = 500;
            return { error: "Failed to create tenant" };
          }
        },
        {
          body: t.Object({
            tenant: t.Object({
              name: t.String(),
              slug: t.String(),
            }),
            restaurant: t.Object({
              name: t.String(),
              currencyCode: t.Optional(t.String()),
              currencyLocale: t.Optional(t.String()),
            }),
            admin: t.Object({
              email: t.String(),
              firstName: t.String(),
              lastName: t.String(),
              staffCode: t.String(),
              pin: t.String(),
            }),
          }),
        },
      )

      // Delete a tenant (with cascade)
      .delete(
        "/tenants/:id",
        async ({ params, platformAuth, set }) => {
          if (!platformAuth) {
            set.status = 401;
            return { error: "Unauthorized" };
          }

          const { id } = params;

          // Verify tenant exists
          const tenantRows = (await sql`
            SELECT id FROM tenant WHERE id = ${id} LIMIT 1
          `) as Array<{ id: string }>;

          if (tenantRows.length === 0) {
            set.status = 404;
            return { error: "Tenant not found" };
          }

          // Delete in order due to foreign keys
          // Note: In production, consider soft delete instead
          await sql`DELETE FROM admin WHERE "staffId" IN (SELECT id FROM staff WHERE "tenantId" = ${id})`;
          await sql`DELETE FROM staff WHERE "tenantId" = ${id}`;
          await sql`DELETE FROM restaurant_settings WHERE "tenantId" = ${id}`;
          await sql`DELETE FROM tenant WHERE id = ${id}`;

          return { success: true };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
        },
      ),
  );
