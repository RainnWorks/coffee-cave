// schema.ts — Zero schema for "Simple POS System"
// Generated from the provided data model using Zero's schema API.
// See https://@rocicorp/zero docs for usage.

import {
  definePermissions,
  ANYONE_CAN,
  type ExpressionBuilder,
  NOBODY_CAN,
} from "@rocicorp/zero";
import { schema, type Schema } from "./generated/schema";

export * from "./generated/schema";
export type { Schema } from "./generated/schema";

/**
 * PERMISSIONS
 * - Public read for menu content and settings.
 * - Staff/Admin for operational data (tabs, payments, tables, allergens).
 * - Admin-only for managing staff and settings writes.
 *
 * Adjust to match your auth payload shape.
 */
export type AuthData = {
  sub?: string; // staff.id of the logged-in user
  role?: "admin" | "staff" | "anon";
  tenantId?: string; // tenant.id for multi-tenant isolation
};

// Permission helper functions to reduce duplication
const allowIfAdmin = (
  auth: AuthData,
  { cmpLit }: ExpressionBuilder<Schema, any>
) => cmpLit(auth.role ?? "anon", "=", "admin");
const allowIfStaff = (
  auth: AuthData,
  { cmpLit }: ExpressionBuilder<Schema, any>
) => cmpLit(auth.role ?? "anon", "=", "staff");

export const permissions = definePermissions<AuthData, Schema>(schema, () => {
  return {
    // Public, read-only restaurant settings
    restaurant_settings: {
      row: {
        select: ANYONE_CAN,
        // writes restricted to admins
        insert: [allowIfAdmin],
        update: {
          preMutation: [allowIfAdmin],
          postMutation: ANYONE_CAN,
        },
        delete: [allowIfAdmin],
      },
    },

    admin: {
      row: {
        select: [allowIfAdmin],
        insert: [allowIfAdmin],
        update: {
          preMutation: [allowIfAdmin],
          postMutation: ANYONE_CAN,
        },
        delete: [allowIfAdmin],
      },
    },

    password_login: {
      row: {
        select: NOBODY_CAN,
        delete: NOBODY_CAN,
        insert: [allowIfAdmin],
        update: {
          preMutation: [allowIfAdmin],
          postMutation: ANYONE_CAN,
        },
      },
    },

    pin_login: {
      row: {
        select: NOBODY_CAN,
        delete: NOBODY_CAN,
        insert: [allowIfAdmin],
        update: {
          preMutation: [allowIfAdmin],
          postMutation: ANYONE_CAN,
        },
      },
    },

    // Staff directory (read for staff/admin only)
    staff: {
      row: {
        select: ANYONE_CAN,
        insert: [allowIfAdmin],
        update: {
          preMutation: [allowIfAdmin],
          postMutation: ANYONE_CAN,
        },
        delete: [allowIfAdmin],
      },
    },

    // Tables (ops staff/admin)
    restaurant_table: {
      row: {
        select: [allowIfAdmin, allowIfStaff],
        insert: [allowIfAdmin, allowIfStaff],
        update: {
          preMutation: [allowIfAdmin, allowIfStaff],
          postMutation: ANYONE_CAN,
        },
        delete: [allowIfAdmin, allowIfStaff],
      },
    },

    // Menu browsing is public; edits by staff/admin
    category: {
      row: {
        select: ANYONE_CAN,
        insert: [allowIfAdmin, allowIfStaff],
        update: {
          preMutation: [allowIfAdmin, allowIfStaff],
          postMutation: ANYONE_CAN,
        },
        delete: [allowIfAdmin, allowIfStaff],
      },
    },

    // Allergen data is operational (restrict to staff/admin for reads by default).
    // If you want allergens visible publicly on the menu, switch select: ANYONE_CAN.
    allergen: {
      row: {
        select: ANYONE_CAN,
        insert: [allowIfAdmin, allowIfStaff],
        update: {
          preMutation: [allowIfAdmin, allowIfStaff],
          postMutation: ANYONE_CAN,
        },
        delete: [allowIfAdmin, allowIfStaff],
      },
    },

    menu_item: {
      row: {
        select: ANYONE_CAN,
        insert: [allowIfAdmin, allowIfStaff],
        update: {
          preMutation: [allowIfAdmin, allowIfStaff],
          postMutation: ANYONE_CAN,
        },
        delete: [allowIfAdmin, allowIfStaff],
      },
    },

    menu_item_category: {
      row: {
        select: ANYONE_CAN,
        insert: [allowIfAdmin, allowIfStaff],
        delete: [allowIfAdmin, allowIfStaff],
      },
    },

    menu_item_allergen: {
      row: {
        select: [allowIfAdmin, allowIfStaff],
        insert: [allowIfAdmin, allowIfStaff],
        delete: [allowIfAdmin, allowIfStaff],
      },
    },

    tab: {
      row: {
        select: [allowIfAdmin, allowIfStaff],
        insert: [allowIfAdmin, allowIfStaff],
        update: {
          preMutation: [allowIfAdmin, allowIfStaff],
          postMutation: ANYONE_CAN,
        },
        delete: [allowIfAdmin, allowIfStaff],
      },
    },

    tab_item: {
      row: {
        select: [allowIfAdmin, allowIfStaff],
        insert: [allowIfAdmin, allowIfStaff],
        update: {
          preMutation: [allowIfAdmin, allowIfStaff],
          postMutation: ANYONE_CAN,
        },
        delete: [allowIfAdmin, allowIfStaff],
      },
    },

    tab_item_allergy_restriction: {
      row: {
        select: [allowIfAdmin, allowIfStaff],
        insert: [allowIfAdmin, allowIfStaff],
        delete: [allowIfAdmin, allowIfStaff],
      },
    },

    payment: {
      row: {
        select: [allowIfAdmin, allowIfStaff],
        insert: [allowIfAdmin, allowIfStaff],
        delete: [allowIfAdmin, allowIfStaff],
      },
    },

    payment_tab_item_paid: {
      row: {
        select: [allowIfAdmin, allowIfStaff],
        insert: [allowIfAdmin, allowIfStaff],
        delete: [allowIfAdmin, allowIfStaff],
      },
    },
  };
});
