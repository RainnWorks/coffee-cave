import { Elysia, t } from "elysia";
import { createMutators } from "../mutators";
import { PushProcessor, ZQLDatabase } from "@rocicorp/zero/server";
import { PostgresJSConnection } from "@rocicorp/zero/pg";
import postgres from "postgres"; // for ZQLDatabase
import { schema } from "../schema";
import { authedPlugin } from "./auth";
import type { ReadonlyJSONValue } from "@rocicorp/zero";

export const zeroPushPlugin = () => {
  // ------------ Zero Push processor ------------
  const processor = new PushProcessor(
    new ZQLDatabase(
      new PostgresJSConnection(postgres(DMNO_CONFIG.ZERO_UPSTREAM_DB)),
      schema
    )
  );
  return new Elysia().use(authedPlugin).post(
    "/push",
    async ({ body, authPayload, request }) => {
      return processor.process(
        createMutators(authPayload),
        new URL(request.url).searchParams,
        body as ReadonlyJSONValue
      );
    },
    { body: t.Unknown() } // accept any content-type
  );
};
