/**
 * Database module - DEPRECATED
 *
 * This file is kept for backwards compatibility but should not be used.
 *
 * For auth queries, use: src/utils/db.ts (raw SQL)
 * For Zero queries/mutations, use: @rocicorp/zero
 *
 * Drizzle is only used for schema generation, not runtime queries.
 */

// Re-export the raw SQL connection for any legacy code
export { sql } from "./utils/db";
