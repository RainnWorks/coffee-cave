import { mustGetMutator, type Transaction } from "@rocicorp/zero";
import { handleMutateRequest } from "@rocicorp/zero/server";
import {
  type PostgresJsTransaction,
  zeroPostgresJS,
} from "@rocicorp/zero/server/adapters/postgresjs";
import { Elysia } from "elysia";
import postgres from "postgres";
import { type MutatorContext, mutators } from "../mutators";
import { type Schema, schema } from "../schema";
import { authedPlugin } from "./auth";

// Create postgres connection and db provider
const sql = postgres(DMNO_CONFIG.ZERO_UPSTREAM_DB);
const dbProvider = zeroPostgresJS(schema, sql);

// Register the database provider for type safety
declare module "@rocicorp/zero" {
  interface DefaultTypes {
    dbProvider: typeof dbProvider;
  }
}

// Type alias for the server transaction used in this push handler
type ServerTx = Transaction<Schema, PostgresJsTransaction>;

export const zeroPushPlugin = new Elysia().use(authedPlugin).post(
  "/push",
  async ({ authPayload, request }) => {
    // Build mutator context from auth payload
    const ctx: MutatorContext = {
      userID: authPayload?.sub,
      role: authPayload?.role as MutatorContext["role"],
      tenantId: authPayload?.tenantId,
    };

    return handleMutateRequest(
      dbProvider,
      (transact) =>
        transact((tx, name, args) => {
          const mutator = mustGetMutator(mutators, name);
          // The tx from ZQLDatabase is TransactionImpl which implements ServerTransaction,
          // which is one branch of the Transaction union type

          return mutator.fn({ args, tx: tx as ServerTx, ctx });
        }),
      request,
    );
  },
  { parse: "none" },
);
