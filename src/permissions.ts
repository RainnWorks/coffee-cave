/**
 * AUTHORIZATION (Zero v0.25+)
 *
 * In Zero v0.25, the definePermissions API is DEPRECATED.
 * Authorization is now handled through context in queries and mutators.
 *
 * See: https://zero.rocicorp.dev/docs/auth
 *
 * Auth context type is defined in: src/zero-types.ts (ZeroContext)
 * Permission helpers are defined in: src/queries.ts and src/mutators.ts
 *
 * This file is kept for backwards compatibility only.
 */

// Re-export ZeroContext as AuthData for backwards compatibility
export type { ZeroContext as AuthData } from "./zero/types";

// Legacy export - empty permissions object
export const permissions = {};
