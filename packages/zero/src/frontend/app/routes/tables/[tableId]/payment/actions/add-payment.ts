"use server";

import { getServerManifestClient } from "@/lib/manifest/api-client/server";
import { partition } from "@/lib/utils";
import { DateTime } from "luxon";

export interface Payment {
  tableId: number;
  tabItemIds: number[];
  paidAmount: number;
  notes?: string;
}

export async function addPayment({
  tableId,
  tabItemIds,
  paidAmount,
  notes,
}: Payment) {
  const client = await getServerManifestClient();
  const createdAt = DateTime.now().toISO();

  const { result: table, errorMessage: tableErrorMessage } =
    await client.tables.getById(tableId);
  if (!table) {
    return { error: tableErrorMessage || "Table not found" };
  }

  const tabItemsResults = await Promise.all(
    tabItemIds.map((id) => client.tabItems.getById(id))
  );

  const [tabItems, tabItemsErrors] = partition(
    (result) => !!result.result,
    tabItemsResults
  );

  if (tabItemsErrors.length > 0) {
    throw new Error(
      tabItemsErrors.map((error) => error.errorMessage).join("\n")
    );
  }

  const missingTabItems = tabItemIds.filter(
    (id) => !tabItems.some((item) => item.result!.id === id)
  );
  if (missingTabItems.length > 0) {
    return {
      error: `Tab items ${missingTabItems.join(", ")} not found`,
    };
  }

  const tabsRequiringLocks = (table.tabs ?? [])
    .filter((tab) => !tab.locked)
    .map((tab) => tab.id);
  const lockingTabs = await Promise.all(
    tabsRequiringLocks.map((tab) => {
      return client.tabs.patch(tab, { locked: true });
    })
  );
  const lockinTabsErrors = lockingTabs.filter(
    (tab) => tab.error || tab.errorMessage
  );
  if (lockinTabsErrors.length > 0) {
    return {
      error:
        "Failed to lock tabs: " +
        lockinTabsErrors.map((error) => error.errorMessage).join("\n"),
    };
  }

  console.log("paying", {
    tableId: tableId,
    tabItemsPaidIds: tabItemIds,
    amount: paidAmount,
    note: notes,
    createdAt,
  });
  const {
    result: payment,
    errorMessage: paymentErrorMessage,
    error,
  } = await client.payments.create({
    tableId: tableId,
    tabItemsPaidIds: tabItemIds,
    amount: paidAmount,
    note: notes,
    createdAt,
  });
  console.log(payment, error);
  if (paymentErrorMessage) {
    console.error("Failed to create payment: ", paymentErrorMessage);
    console.error("Unlocking tabs...");
    const unlockResults = await Promise.all(
      tabsRequiringLocks.map((tab) => {
        return client.tabs.patch(tab, { locked: false });
      })
    );
    console.error("Tabs unlocked", unlockResults);
    return { error: paymentErrorMessage };
  }

  if (!payment) {
    return { error: "No payment returned" };
  }

  return { error: undefined, result: payment };
}

/**
 * Applies multiple payments in sequence. Each payment is processed independently.
 * Returns an array of results (success or error) for each payment.
 */
export async function addMultiplePayments(payments: Payment[]) {
  const results = [];
  for (const payment of payments) {
    try {
      const result = await addPayment(payment);
      results.push(result);
    } catch (error) {
      results.push({
        error: (error as Error | undefined)?.message || "Unknown error",
        result: undefined,
      });
    }
  }
  return results;
}
