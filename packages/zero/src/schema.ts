// schema.ts — Zero schema for "Simple POS System"
// Generated from the provided data model using Zero's schema API.
// See https://@rocicorp/zero docs for usage.

import {
  definePermissions,
  ANYONE_CAN,
  type ExpressionBuilder,
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
};

// Permission helper functions to reduce duplication
const allowIfAdmin = (
  auth: AuthData,
  { cmpLit }: ExpressionBuilder<Schema, any>
) => cmpLit(auth.role ?? "anon", "=", "admin");

const allowIfStaffOrAdmin = (
  auth: AuthData,
  { cmpLit }: ExpressionBuilder<Schema, any>
) =>
  cmpLit(auth.role ?? "anon", "=", "staff") ||
  cmpLit(auth.role ?? "anon", "=", "admin");

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

    // Staff directory (read for staff/admin only)
    staff: {
      row: {
        select: [allowIfStaffOrAdmin],
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
        select: [allowIfStaffOrAdmin],
        insert: [allowIfStaffOrAdmin],
        update: {
          preMutation: [allowIfStaffOrAdmin],
          postMutation: ANYONE_CAN,
        },
        delete: [allowIfStaffOrAdmin],
      },
    },

    // Menu browsing is public; edits by staff/admin
    category: {
      row: {
        select: ANYONE_CAN,
        insert: [allowIfStaffOrAdmin],
        update: {
          preMutation: [allowIfStaffOrAdmin],
          postMutation: ANYONE_CAN,
        },
        delete: [allowIfStaffOrAdmin],
      },
    },

    // Allergen data is operational (restrict to staff/admin for reads by default).
    // If you want allergens visible publicly on the menu, switch select: ANYONE_CAN.
    allergen: {
      row: {
        select: ANYONE_CAN,
        insert: [allowIfStaffOrAdmin],
        update: {
          preMutation: [allowIfStaffOrAdmin],
          postMutation: ANYONE_CAN,
        },
        delete: [allowIfStaffOrAdmin],
      },
    },

    menu_item: {
      row: {
        select: ANYONE_CAN,
        insert: [allowIfStaffOrAdmin],
        update: {
          preMutation: [allowIfStaffOrAdmin],
          postMutation: ANYONE_CAN,
        },
        delete: [allowIfStaffOrAdmin],
      },
    },

    menu_item_category: {
      row: {
        select: ANYONE_CAN,
        insert: [allowIfStaffOrAdmin],
        delete: [allowIfStaffOrAdmin],
      },
    },

    menu_item_allergen: {
      row: {
        select: [allowIfStaffOrAdmin],
        insert: [allowIfStaffOrAdmin],
        delete: [allowIfStaffOrAdmin],
      },
    },

    tab: {
      row: {
        select: [allowIfStaffOrAdmin],
        insert: [allowIfStaffOrAdmin],
        update: {
          preMutation: [allowIfStaffOrAdmin],
          postMutation: ANYONE_CAN,
        },
        delete: [allowIfStaffOrAdmin],
      },
    },

    tab_item: {
      row: {
        select: [allowIfStaffOrAdmin],
        insert: [allowIfStaffOrAdmin],
        update: {
          preMutation: [allowIfStaffOrAdmin],
          postMutation: ANYONE_CAN,
        },
        delete: [allowIfStaffOrAdmin],
      },
    },

    tab_item_allergy_restriction: {
      row: {
        select: [allowIfStaffOrAdmin],
        insert: [allowIfStaffOrAdmin],
        delete: [allowIfStaffOrAdmin],
      },
    },

    payment: {
      row: {
        select: [allowIfStaffOrAdmin],
        insert: [allowIfStaffOrAdmin],
        delete: [allowIfStaffOrAdmin],
      },
    },

    payment_tab_item_paid: {
      row: {
        select: [allowIfStaffOrAdmin],
        insert: [allowIfStaffOrAdmin],
        delete: [allowIfStaffOrAdmin],
      },
    },
  };
});
