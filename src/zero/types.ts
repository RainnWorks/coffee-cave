/**
 * Zero Type Registration
 *
 * This file registers the schema and context types with Zero via module augmentation.
 * This ensures proper type inference across all Zero operations (queries, mutators, etc.)
 *
 * See: https://zero.rocicorp.dev/docs/auth#defining-custom-context-type-for-zero
 */

import type { Schema } from "./schema.gen";

/**
 * Shared context type for both queries and mutators.
 * Populated from JWT claims on the server.
 *
 * Roles:
 * - "staff": Tenant staff member (basic operational access)
 * - "admin": Tenant admin (full tenant access)
 * - "platform": Platform admin (cross-tenant access for management)
 * - "anon": Anonymous/unauthenticated
 */
export type ZeroContext = {
  userID?: string;
  role?: "admin" | "staff" | "platform" | "anon";
  tenantId?: string;
};

/**
 * Register types with Zero's DefaultTypes for proper type inference.
 */
declare module "@rocicorp/zero" {
  interface DefaultTypes {
    schema: Schema;
    context: ZeroContext;
  }
}
