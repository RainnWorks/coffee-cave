import { Elysia, t } from "elysia";
import { createMutators } from "../mutators";
import { PushProcessor, ZQLDatabase } from "@rocicorp/zero/server";
import { PostgresJSConnection } from "@rocicorp/zero/pg";
import postgres from "postgres"; // for ZQLDatabase
import { schema } from "../schema";

export const zeroPushPlugin = () => {
  // ------------ Zero Push processor ------------
  const processor = new PushProcessor(
    new ZQLDatabase(
      new PostgresJSConnection(postgres(DMNO_CONFIG.ZERO_UPSTREAM_DB)),
      schema
    )
  );
  return new Elysia().post(
    "/push",
    async ({ request }) => {
      const body = await request.json();
      return processor.process(createMutators(), body);
    },
    { body: t.Unknown() } // accept any content-type
  );
};
