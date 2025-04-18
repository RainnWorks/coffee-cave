"use server";

import { getServerManifestClient } from "@/lib/manifest/api-client/server";
import type { BasketItem } from "../contexts/basket";
import type { Allergen, MenuItemWithCategory } from "@/lib/manifest/types";
import { DateTime } from "luxon";

export async function addItems(tabId: number, items: BasketItem[]) {
  const client = await getServerManifestClient();
  const createdAt = DateTime.now().toISO();
  const tabItems = await Promise.all(
    items.map((item) => {
      console.log({
        tab: { id: tabId },
        allergyRestrictions: item.allergenIds.map((id) => ({
          id,
        })) as Allergen[],
        notes: item.notes,
        menuItem: item.item.menuItemId
          ? ({
              id: item.item.menuItemId,
            } as MenuItemWithCategory)
          : undefined,
        createdAt,
        nameOverride: item.item.nameOverride,
        priceOverride: item.item.priceOverride,
      });

      return client.tabItems.create({
        tab: { id: tabId },
        allergyRestrictions: item.allergenIds.map((id) => ({
          id,
        })) as Allergen[],
        notes: item.notes,
        menuItem: item.item.menuItemId
          ? ({
              id: item.item.menuItemId,
            } as MenuItemWithCategory)
          : undefined,
        createdAt,
        nameOverride: item.item.nameOverride,
        priceOverride: item.item.priceOverride,
      });
    })
  );
  return tabItems;
}
