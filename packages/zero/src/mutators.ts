// mutators.ts
import type { CustomMutatorDefs } from "@rocicorp/zero";
import type { AuthData, RestaurantTable, Schema, Tab } from "./schema";
import { DateTime } from "luxon";
import { create } from "node:domain";
import { isId } from "./utils/ids";

export function createMutators(authData: AuthData | undefined) {
  return {
    restaurant_table: {
      insert: async (tx, args: RestaurantTable) => {
        if (!authData?.sub) {
          throw new Error("No auth data");
        }
        if (!isId("table", args.id)) {
          throw new Error("Invalid table id");
        }
        await tx.mutate.restaurant_table.insert({
          ...args,
          createdAt: DateTime.now().toMillis(),
          createdById: authData.sub,
        });
      },
      update: async (tx, args: RestaurantTable) => {
        if (!authData?.sub) {
          throw new Error("No auth data");
        }
        await tx.mutate.restaurant_table.update({
          ...args,
          closedAt: args.closed ? DateTime.now().toMillis() : null,
          closedById: args.closed ? authData.sub : null,
        });
      },
    },
    tab: {
      insert: async (tx, args: Tab) => {
        if (!authData?.sub) {
          throw new Error("No auth data");
        }
        if (!isId("tab", args.id)) {
          throw new Error("Invalid tab id");
        }
        await tx.mutate.tab.insert({
          ...args,
          createdAt: DateTime.now().toMillis(),
        });
      },
      update: async (tx, args: Tab) => {
        if (!authData?.sub) {
          throw new Error("No auth data");
        }
        await tx.mutate.tab.update({
          ...args,
          closedAt: args.closed ? DateTime.now().toMillis() : null,
          closedByID: authData.sub,
        });
      },
    },
  } as const satisfies CustomMutatorDefs<Schema>;
}

export type Mutators = ReturnType<typeof createMutators>;
