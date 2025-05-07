"use server";

import { getServerManifestClient } from "@/lib/manifest/api-client/server";
import { Staff } from "@/lib/manifest/types";
import { DateTime } from "luxon";

export async function closeTab(tableId: number, tabId: number) {
  const client = await getServerManifestClient();
  const me = await client.staffAuth.me();
  const createdAt = DateTime.now().toISO();

  const tab = await client.tabs.getById(tabId);

  if (tab.errorMessage) {
    return {
      error: "Failed to close tab: " + tab.errorMessage,
    };
  }
  if (!tab.result)
    return {
      error: "Couldn't find tab: " + tabId,
    };

  const tabItems = await client.tabs.patch(tabId, {
    id: tabId,
    paid: true,
    staff: me.result?.id,
    closed: true,
    closedAt: createdAt,
    closedBy: me.result?.id ? ({ id: me.result?.id } as Staff) : undefined,
  });
  if (tabItems.errorMessage) {
    return {
      error: "Failed to close tab: " + tabItems.errorMessage,
    };
  }
  const table = await client.tables.getById(tableId);

  return { error: undefined, result: { table } };
}
