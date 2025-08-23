// mutators.ts
import type { CustomMutatorDefs } from "@rocicorp/zero";
import type { AuthData, Payment, PaymentTabItemPaid, RestaurantTable, Schema, Tab } from "./schema";
import { DateTime } from "luxon";
import { isId } from "./utils/ids";

export function createMutators(authData: AuthData | null | undefined) {
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
        if (args.closed) {
          const tabsToClose = await tx.query.tab
            .where("tableID", "=", args.id)
            .where("closed", "=", false)
            .run();
          if (tabsToClose.length > 0) {
            throw new Error("Cannot close table with open tabs");
          }
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
        console.log(tx.location, tx.reason);

        if (!authData?.sub) {
          throw new Error("No auth data");
        }
        if (args.closed) {
          const tabsToClose = await tx.query.tab
            .where("id", "=", args.id)
            .related("items")
            .one()
            .run();
          if (tabsToClose?.items?.length === 0) {
            await tx.mutate.tab.delete({
              id: args.id,
            });
          } else {
            await tx.mutate.tab.update({
              ...args,
              closedAt: args.closed ? DateTime.now().toMillis() : null,
              closedByID: authData.sub,
            });
          }
        }
      },
    },
    payment: {
      insert: async (tx, args: Payment) => {
        if (!authData?.sub) {
          throw new Error("No auth data");
        }
        if (!isId("payment", args.id)) {
          throw new Error("Invalid payment id");
        }
        await tx.mutate.payment.insert({
          ...args,
          createdAt: DateTime.now().toMillis(),
          createdByID: authData.sub,
        });
      },
    },
    payment_tab_item_paid: {
      insert: async (tx, args: PaymentTabItemPaid) => {
        await tx.mutate.payment_tab_item_paid.insert({
          ...args,
        });
      },
    },
  } as const satisfies CustomMutatorDefs<Schema>;
}

export type Mutators = ReturnType<typeof createMutators>;
