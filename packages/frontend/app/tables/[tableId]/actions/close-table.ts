"use server";

import { getServerManifestClient } from "@/lib/manifest/api-client/server";
import { closeTab } from "./close-tab";

export const closeTable = async (tableId: number) => {
  const client = await getServerManifestClient();

  const { result: table, errorMessage: tableErrorMessage } =
    await client.tables.getById(tableId);

  if (tableErrorMessage || !table) {
    return { error: tableErrorMessage ?? "Table not found" };
  }

  const tabs = table.tabs?.filter((tab) => !tab.closed);

  if (tabs?.length) {
    const closeResults = await Promise.all(
      tabs.map((tab) => closeTab(tableId, tab.id))
    );
    const closeResultsErrors = closeResults.filter((tab) => tab.error);
    if (closeResultsErrors.length > 0) {
      return {
        error:
          "Failed to close tabs: " +
          closeResultsErrors.map((error) => error.error).join("\n"),
      };
    }
  }

  const { errorMessage, result } = await client.tables.patch(tableId, {
    closed: true,
    closedAt: new Date().toISOString(),
  });

  if (errorMessage) {
    return { error: errorMessage };
  }

  return { success: !!result?.id };
};
