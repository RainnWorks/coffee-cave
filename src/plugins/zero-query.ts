import { mustGetQuery } from "@rocicorp/zero";
import { handleQueryRequest } from "@rocicorp/zero/server";
import { Elysia } from "elysia";
import { type QueryContext, queries } from "../queries";
import { schema } from "../schema";
import { authedPlugin } from "./auth";

/**
 * Zero Query Endpoint Plugin
 *
 * Handles query requests from zero-cache by:
 * 1. Looking up the query by name in the registry
 * 2. Invoking it with the args and auth context
 * 3. Returning the ZQL AST to zero-cache
 */
export const zeroQueryPlugin = new Elysia().use(authedPlugin).post(
  "/query",
  async ({ authPayload, request }) => {
    // Build the query context from auth payload
    // Note: tenantId should be added to AuthPayload if multi-tenant
    const ctx: QueryContext = {
      userID: authPayload?.sub,
      role: authPayload?.role as QueryContext["role"],
      tenantId: authPayload?.tenantId,
    };

    return handleQueryRequest(
      (name, args) => {
        const query = mustGetQuery(queries, name);
        return query.fn({ args, ctx });
      },
      schema,
      request,
    );
  },
  { parse: "none" },
);
