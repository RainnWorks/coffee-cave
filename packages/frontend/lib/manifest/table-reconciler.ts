import { IconName } from "lucide-react/dynamic";
import { TabItemWithMenuItemSchema, TabSchema, TableSchema } from "./types";
import { notEmpty } from "../utils";
import { z } from "zod";

// Zod schemas for the reconciled types
export const ReconciledTabItemSchema = TabItemWithMenuItemSchema.extend({
  icon: z.string() as z.ZodType<IconName>,
  name: z.string(),
  paid: z.boolean(),
  price: z.number(),
});

export type ReconciledTabItem = z.infer<typeof ReconciledTabItemSchema>;

export const ReconciledTabSchema = TabSchema.omit({
  tabItems: true,
}).extend({
  name: z.string(),
  icon: z.string() as z.ZodType<IconName>,
  tabItems: z.array(ReconciledTabItemSchema),
  remainingBalance: z.number(),
  paid: z.boolean(),
});

export type ReconciledTab = z.infer<typeof ReconciledTabSchema>;

const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Generate a descriptive name for a tab based on its items
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

// Create a transform function that can be applied to TableSchema
export const ReconciledTableSchema = TableSchema.transform((table) => {
  let tableBalance = 0;
  let tableTotal = 0;
  const tabBalances: Record<string, number> = {};

  table.tabs?.forEach((tab) => {
    if (!tabBalances[tab.id]) tabBalances[tab.id] = 0;
    const tabTotal = tab.tabItems.reduce(
      (balance, tabItem) =>
        balance + (tabItem.priceOverride || tabItem.menuItem?.price || 0),
      0
    );
    tabBalances[tab.id] = tabTotal;
    tableBalance += tabTotal;
    tableTotal += tabTotal;
  });

  table.payments?.forEach((payment) => {
    let paymentToAllocate = payment.amount;
    tableBalance -= paymentToAllocate;
    payment.tabItemsPaids.forEach((tabItem) => {
      const tabId = tabItem.id;
      if (!tabBalances[tabId]) tabBalances[tabId] = 0;
      const tabBalance = tabBalances[tabId];
      const allocation = Math.min(paymentToAllocate, tabBalance);
      tabBalances[tabId] -= allocation;
      paymentToAllocate -= allocation;
    });
  });

  // Create a map of paid tab items for faster lookups
  const paidTabItemIds = new Set<number>();
  table.payments?.forEach((payment) => {
    payment.tabItemsPaids.forEach((tabItem) => {
      paidTabItemIds.add(tabItem.id);
    });
  });

  const reconciledTabs = table.tabs?.map((tab) => {
    // Process tab items first
    const tabItems = tab.tabItems.map((tabItem) => {
      // Use the ReconciledTabItemSchema to create a base reconciled tab item
      const baseTabItem = {
        ...tabItem,
        name: tabItem.nameOverride ?? tabItem.menuItem?.name ?? "Custom",
        icon: (tabItem.menuItem?.categories?.[0]?.icon ??
          "hand-platter") as IconName,
        paid: paidTabItemIds.has(tabItem.id),
        price: tabItem.priceOverride || tabItem.menuItem?.price || 0,
      };

      // Return the reconciled tab item
      return ReconciledTabItemSchema.parse(baseTabItem);
    });

    // Create a base reconciled tab
    const baseTab = {
      ...tab,
      icon: tabItems[0]?.icon ?? ("hand-platter" as IconName),
      name: generateTabName(
        tabItems
          .map(
            (tabItem) =>
              tabItem.menuItem?.categories?.map((category) => category.name) ??
              []
          )
          .flat()
          .filter(notEmpty) || ["Custom"]
      ),
      remainingBalance: tabBalances[tab.id] ?? 0,
      tabItems,
      paid: tabItems.every((item) => item.paid),
    };

    // Return the reconciled tab
    return ReconciledTabSchema.parse(baseTab);
  });

  // Create a base reconciled table
  const baseTable = {
    ...table,
    total: tableTotal,
    remainingBalance: tableBalance,
    tabs: reconciledTabs,
  };

  // Return the reconciled table
  return TableSchema.omit({
    tabs: true,
  })
    .extend({
      total: z.number(),
      remainingBalance: z.number(),
      tabs: z.array(ReconciledTabSchema).optional(),
    })
    .parse(baseTable);
});
export type ReconciledTable = z.infer<typeof ReconciledTableSchema>;
