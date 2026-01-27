import { useQuery } from "@rocicorp/zero/react";
import type { IconName } from "lucide-react/dynamic";
import { useMemo } from "react";
import { queries } from "@/queries";

const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const generateTabName = (categories: string[]): string => {
  if (categories.length === 0) return "Empty";

  const categoriesSet = [...new Set(categories)]
    .map((cat) => cat.toLowerCase())
    .slice(0, 3);
  categoriesSet[0] = capitalize(categoriesSet[0]);
  if (categoriesSet.length === 1) return categoriesSet[0];

  // Join with commas but use "and" for the last element
  const lastElement = categoriesSet.pop();
  return categoriesSet.join(", ") + " and " + lastElement;
};

// Type helper - extract table type from query result
const _OnlyUsedForTypes = () => {
  const [x] = useQuery(queries.tables.allWithDetails());
  return x?.[0];
};

type Table = Exclude<ReturnType<typeof _OnlyUsedForTypes>, undefined>;

const reconcileTable = (table: Table) => {
  let tableBalance = 0;
  let tableTotal = 0;
  const tabBalances: Record<string, number> = {};

  // Calculate initial tab balances and table total
  table.tabs?.forEach((tab) => {
    if (!tabBalances[tab.id]) tabBalances[tab.id] = 0;
    const tabTotal = tab.items.reduce(
      (balance, tabItem) =>
        balance + (tabItem.priceOverride || tabItem.menuItem?.price || 0),
      0,
    );
    tabBalances[tab.id] = tabTotal;
    tableBalance += tabTotal;
    tableTotal += tabTotal;
  });

  // Adjust balances based on payments
  table.payments?.forEach((payment) => {
    let paymentToAllocate = payment.amount;
    tableBalance -= paymentToAllocate;

    // Distribute payment across tab items
    payment.tabItems.forEach((tabItemPaid) => {
      // Find the tab ID for this tab item
      const tabItem = table.tabs
        ?.flatMap((tab) => tab.items)
        .find((item) => item.id === tabItemPaid.tabItemID);
      if (!tabItem) return;

      const tabId = tabItem.tabID;
      if (!tabBalances[tabId]) tabBalances[tabId] = 0;
      const tabBalance = tabBalances[tabId];
      const allocation = Math.min(paymentToAllocate, tabBalance);
      tabBalances[tabId] -= allocation;
      paymentToAllocate -= allocation;
    });
  });

  // Create a set of paid tab item IDs for faster lookups
  const paidTabItemIds = new Set<string>();
  table.payments?.forEach((payment) => {
    payment.tabItems.forEach((tabItemPaid) => {
      paidTabItemIds.add(tabItemPaid.tabItemID);
    });
  });

  // Process tabs and their items
  const reconciledTabs =
    table.tabs?.map((tab) => {
      // Process tab items first
      const reconciledTabItems = tab.items?.map((tabItem) => {
        return {
          ...tabItem,
          paid: paidTabItemIds.has(tabItem.id),
          price: tabItem.priceOverride || tabItem.menuItem?.price || 0,
        };
      });

      const categories = tab.items?.flatMap(
        (item) => item.menuItem?.categories?.[0]?.category,
      );

      // Create a reconciled tab
      return {
        ...tab,
        icon: (categories?.[0]?.icon as IconName) ?? undefined,
        name: generateTabName(
          categories.map((cat) => cat?.name).filter((x): x is string => !!x),
        ),
        tabItems: reconciledTabItems || [],
        remainingBalance: tabBalances[tab.id] ?? 0,
        paid: reconciledTabItems.every((item) => item.paid),
      };
    }) || [];

  // Return the reconciled table
  return {
    ...table,
    tabs: reconciledTabs,
    total: tableTotal,
    remainingBalance: tableBalance,
  };
};

export type ReconciledTable = ReturnType<typeof reconcileTable>;
export type ReconciledTabItem =
  ReconciledTable["tabs"][number]["tabItems"][number];

/**
 * Hook to get a single reconciled table by ID
 * Uses query registry with permission checks
 */
export const useReconciledTableQuery = (id: string) => {
  const [table, { type }] = useQuery(queries.tables.byId({ id }));

  return useMemo(
    () =>
      [table ? reconcileTable(table as Table) : undefined, { type }] as const,
    [table, type],
  );
};

/**
 * Hook to get all reconciled tables
 * Uses query registry with permission checks
 */
export const useReconciledTablesQuery = () => {
  const [tables, { type }] = useQuery(queries.tables.allWithDetails());

  return useMemo(
    () => [(tables as Table[]).map(reconcileTable), { type }] as const,
    [tables, type],
  );
};
