import { useRestaurantConfig } from "@frontend/contexts/restaurant-config";
import type { GroupedItem } from "@frontend/lib/basket";
import { cn } from "@frontend/lib/utils";
import { useTypedZero } from "@frontend/zero";
import { useQuery } from "@rocicorp/zero/react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChefHat,
  Clock,
  Loader2,
  Search,
  Zap,
} from "lucide-react";
import { DateTime } from "luxon";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Badge } from "@/frontend/app/ui/badge";
import { Button } from "@/frontend/app/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/frontend/app/ui/card";
import { Label } from "@/frontend/app/ui/label";
import { Switch } from "@/frontend/app/ui/switch";
import { mutators } from "@/mutators";
import { queries } from "@/queries";

type KitchenItem = {
  id: string;
  name: string;
  notes?: string;
  category: string;
  tableNumber: string;
  tabId: string;
  timeOrdered: string;
  quantity: number;
  allergies?: string[];
  status: "prepping" | "ready" | "served";
  // Fields needed for grouping
  menuItemId?: string | null;
  nameOverride?: string | null;
  priceOverride?: number | null;
  allergenIds?: string[];
  createdAt: number | null;
  tabItemIds: string[]; // Array of original tab item IDs for bulk operations
};

// Kitchen-specific groupable item interface
interface KitchenGroupableItem {
  menuItemId?: string | null;
  nameOverride?: string | null;
  priceOverride?: number | null;
  allergenIds?: string[];
  notes?: string | null;
  createdAt: number | null; // Add creation date to grouping
  menuItem?: {
    id: string;
  } | null;
}

// Hash function for consistent ID generation
const hashCode = (str: string): number => {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

// Generate item ID for kitchen grouping (includes creation date)
const generateKitchenItemId = ({
  allergenIds,
  menuItemId,
  nameOverride,
  priceOverride,
  notes,
  menuItem,
  createdAt,
}: KitchenGroupableItem): string => {
  const itemKey = menuItemId ?? menuItem?.id ?? undefined;
  const allergenKey =
    (allergenIds?.length ?? 0) > 0
      ? `allergenIds(${[...(allergenIds ?? [])].sort().join(",")})`
      : undefined;

  const notesKey = notes ? `notes(${hashCode(notes)})` : undefined;
  const priceOverrideKey = priceOverride
    ? `price(${priceOverride})`
    : undefined;
  const nameOverrideKey = nameOverride ? `name(${nameOverride})` : undefined;

  // Group by creation date (rounded to nearest minute to group items ordered at similar times)
  const createdAtKey = createdAt
    ? `created(${Math.floor(createdAt / 60000) * 60000})`
    : "created(0)";

  return [
    itemKey,
    allergenKey,
    notesKey,
    priceOverrideKey,
    nameOverrideKey,
    createdAtKey,
  ]
    .filter(Boolean)
    .join("-");
};

// Group kitchen items using the same logic as basket but with creation date
const groupKitchenItems = (
  items: KitchenItem[],
): { [key: string]: GroupedItem<KitchenItem> } => {
  return items.reduce(
    (acc, item, i) => {
      const itemKey = generateKitchenItemId(item);
      const existingItem = acc[itemKey] as GroupedItem<KitchenItem> | undefined;

      return {
        ...acc,
        [itemKey]: {
          ...item,
          key: itemKey,
          itemIndexes: !existingItem ? [i] : [...existingItem.itemIndexes, i],
          items: !existingItem ? [item] : [...existingItem.items, item],
          count: (existingItem?.count || 0) + 1,
          quantity: (existingItem?.quantity || 0) + item.quantity,
          tabItemIds: !existingItem
            ? item.tabItemIds
            : [...existingItem.tabItemIds, ...item.tabItemIds],
        },
      };
    },
    {} as { [key: string]: GroupedItem<KitchenItem> },
  );
};

export default function KitchenView() {
  const config = useRestaurantConfig();
  const [, setLocation] = useLocation();
  const z = useTypedZero(); // For mutations

  // Query for all categories from database
  const [categories] = useQuery(queries.menu.categories());

  // Count queries for header display
  const [preppingItems] = useQuery(queries.kitchen.preppingItems());

  const [readyItems] = useQuery(queries.kitchen.readyItems());

  const [showPrepMode, setShowPrepMode] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [processingItems, setProcessingItems] = useState<
    Record<string, boolean>
  >({});
  // biome-ignore lint/correctness/noUnusedVariables: Used for notification display state, may be used in future UI updates
  const [showNotification, setShowNotification] = useState(false);

  // Query for tab items filtered by prep/serve mode with full relations
  const [tabItems, { type: queryType }] = useQuery(
    queries.kitchen.itemsByMode({ prepMode: showPrepMode }),
  );
  const isLoading = queryType !== "complete";

  // Transform tab items to kitchen items with status determination and category filtering
  const orderItems: KitchenItem[] = useMemo(() => {
    if (!tabItems) return [];

    const transformed = tabItems.map((item) => {
      // Determine status based on readyAt and servedAt timestamps
      let status: "prepping" | "ready" | "served";
      if (item.servedAt) {
        status = "served";
      } else if (item.readyAt) {
        status = "ready";
      } else {
        status = "prepping";
      }

      // Extract allergen IDs for grouping
      const allergenIds =
        item.allergyRestrictions
          ?.map((ar) => ar.allergen?.id)
          .filter((id): id is string => !!id) || [];

      return {
        id: item.id,
        name: item.nameOverride || item.menuItem?.name || "Custom Item",
        notes: item.notes || undefined,
        category: item.menuItem?.categories?.[0]?.category?.name || "Other",
        tableNumber: item.tab?.table?.name || "Unknown",
        tabId: item.tabID,
        timeOrdered: DateTime.fromMillis(
          item.createdAt ?? Date.now(),
        ).toLocaleString(DateTime.TIME_SIMPLE),
        quantity: 1, // Each TabItem represents one item
        allergies:
          item.allergyRestrictions
            ?.map((ar) => ar.allergen?.name)
            .filter((name): name is string => !!name) || undefined,
        status,
        // Fields needed for grouping
        menuItemId: item.menuItemID,
        nameOverride: item.nameOverride,
        priceOverride: item.priceOverride,
        allergenIds: allergenIds,
        createdAt: item.createdAt,
        tabItemIds: [item.id], // Single item ID for individual items
      };
    });

    // Filter by selected categories if any are selected
    if (selectedCategories.length > 0) {
      return transformed.filter((item) =>
        selectedCategories.includes(item.category),
      );
    }

    return transformed;
  }, [tabItems, selectedCategories]);

  // Query for all tab items to get accurate category counts
  const [allTabItems] = useQuery(
    queries.kitchen.itemsForCategoryCounts({ prepMode: showPrepMode }),
  );

  // Get all categories with item counts for the current mode
  const categoriesWithCounts = useMemo(() => {
    if (!categories || !allTabItems) return [];

    // Create a map of category counts from all items in current mode
    const categoryCountMap = new Map<string, number>();

    allTabItems.forEach((item) => {
      const categoryName =
        item.menuItem?.categories?.[0]?.category?.name || "Other";
      categoryCountMap.set(
        categoryName,
        (categoryCountMap.get(categoryName) || 0) + 1,
      );
    });

    // Return all categories from database with their counts (0 if no items)
    return categories
      .map((category) => ({
        id: category.name,
        name: category.name,
        count: categoryCountMap.get(category.name) || 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categories, allTabItems]);

  // Handle category toggle
  const handleCategoryToggle = useCallback((categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  }, []);

  // Utility functions for grouping and late detection
  const isItemLate = useCallback((item: KitchenItem) => {
    const now = Date.now();
    const orderTime = DateTime.fromISO(item.timeOrdered).toMillis();
    const minutesElapsed = (now - orderTime) / (1000 * 60);
    return minutesElapsed > 15; // Consider items late after 15 minutes
  }, []);

  const formatTimeWithUrgency = useCallback((createdAt: number) => {
    const now = Date.now();
    const minutesElapsed = (now - createdAt) / (1000 * 60);
    const isLate = minutesElapsed > 15;
    const isUrgent = minutesElapsed > 10;

    return {
      text: `${Math.floor(minutesElapsed)}m ago`,
      isLate,
      isUrgent,
    };
  }, []);

  const groupItemsByTableAndCategory = useCallback(
    (items: KitchenItem[]) => {
      // First group items using kitchen grouping logic
      const groupedItems = groupKitchenItems(items);
      const groupedItemsArray = Object.values(groupedItems);

      const grouped: Record<string, GroupedItem<KitchenItem>[]> = {};

      groupedItemsArray.forEach((item) => {
        const key = item.tableNumber;
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(item);
      });

      return Object.entries(grouped)
        .map(([tableNumber, tableItems]) => {
          // Group by category within table
          const categoryGroups: Record<string, GroupedItem<KitchenItem>[]> = {};
          tableItems.forEach((item) => {
            if (!categoryGroups[item.category]) {
              categoryGroups[item.category] = [];
            }
            categoryGroups[item.category].push(item);
          });

          const categories = Object.entries(categoryGroups).map(
            ([categoryName, items]) => {
              const category = {
                id: categoryName,
                name: categoryName,
                icon: "utensils",
              };
              const readyCount = items.filter(
                (item) => item.status === "ready",
              ).length;
              const totalCount = items.length;

              return {
                category,
                items: items.sort((a, b) => {
                  // Sort by late items first, then by creation time
                  const aLate = isItemLate(a);
                  const bLate = isItemLate(b);
                  if (aLate && !bLate) return -1;
                  if (!aLate && bLate) return 1;
                  return (a.createdAt ?? 0) - (b.createdAt ?? 0);
                }),
                readyCount,
                totalCount,
                allReady: readyCount === totalCount,
              };
            },
          );

          const readyItems = tableItems.filter(
            (item) => item.status === "ready",
          ).length;
          const totalItems = tableItems.length;
          const hasLateItems = tableItems.some(isItemLate);

          return {
            tableNumber,
            categories,
            readyItems,
            totalItems,
            isComplete: readyItems === totalItems,
            urgencyLevel: hasLateItems
              ? ("high" as const)
              : ("normal" as const),
          };
        })
        .sort((a, b) => {
          // Sort tables by urgency: high urgency first, then by table number
          if (a.urgencyLevel === "high" && b.urgencyLevel !== "high") return -1;
          if (a.urgencyLevel !== "high" && b.urgencyLevel === "high") return 1;
          return parseInt(a.tableNumber) - parseInt(b.tableNumber);
        });
    },
    [isItemLate],
  );

  const getReadyItemsByTable = useCallback(
    (items: KitchenItem[], tableNumber: string) => {
      const groupedItems = groupKitchenItems(items);
      return Object.values(groupedItems).filter(
        (item) => item.tableNumber === tableNumber && item.status === "ready",
      );
    },
    [],
  );

  const getReadyItemsByTableAndCategory = useCallback(
    (items: KitchenItem[], tableNumber: string, categoryId: string) => {
      const groupedItems = groupKitchenItems(items);
      return Object.values(groupedItems).filter(
        (item) =>
          item.tableNumber === tableNumber &&
          item.status === "ready" &&
          item.category === categoryId,
      );
    },
    [],
  );

  // Handle back button
  const handleBack = () => {
    setLocation("/tables");
  };

  // Handle item status update with optimistic updates and undo for grouped items
  const handleUpdateStatus = async (
    item: GroupedItem<KitchenItem>,
    newStatus: "ready" | "served" | "prepping",
  ) => {
    const itemKey = item.key;
    setProcessingItems((prev) => ({ ...prev, [itemKey]: true }));

    // Store previous state for undo
    const previousState = {
      readyAt:
        item.status === "ready" || item.status === "served" ? Date.now() : null,
      servedAt: item.status === "served" ? Date.now() : null,
    };

    // Haptic feedback
    if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }

    try {
      // Batch update all tab items in the group
      const statusMap = {
        ready: "ready",
        served: "served",
        prepping: "reset",
      } as const;

      await z.mutate(
        mutators.tabItem.updateStatusBatch({
          ids: item.tabItemIds,
          status: statusMap[newStatus],
        }),
      );

      if (newStatus === "ready") {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      }

      // Show undo toast
      const itemDescription =
        item.quantity > 1 ? `${item.quantity}x ${item.name}` : item.name;
      toast.success(`${itemDescription} marked as ${newStatus}`, {
        action: {
          label: "Undo",
          onClick: async () => {
            // Undo by setting back to previous status
            const undoStatusMap = {
              ready: previousState.readyAt ? "ready" : "reset",
              served: previousState.servedAt
                ? "served"
                : previousState.readyAt
                  ? "ready"
                  : "reset",
              prepping: previousState.servedAt
                ? "served"
                : previousState.readyAt
                  ? "ready"
                  : "reset",
            } as const;
            await z.mutate(
              mutators.tabItem.updateStatusBatch({
                ids: item.tabItemIds,
                status: undoStatusMap[newStatus],
              }),
            );
            toast.success("Action undone");
          },
        },
      });
    } catch (error) {
      console.error("Error updating item status:", error);
      toast.error("Failed to update item status");
    } finally {
      setProcessingItems((prev) => ({ ...prev, [itemKey]: false }));
    }
  };

  // Handle bulk serving for grouped items
  const handleBulkServe = async (tableNumber: string, categoryId?: string) => {
    const itemsToServe = categoryId
      ? getReadyItemsByTableAndCategory(orderItems, tableNumber, categoryId)
      : getReadyItemsByTable(orderItems, tableNumber);

    if (itemsToServe.length === 0) return;

    const processingUpdates = itemsToServe.reduce(
      (acc, item) => {
        acc[item.key] = true;
        return acc;
      },
      {} as Record<string, boolean>,
    );
    setProcessingItems((prev) => ({ ...prev, ...processingUpdates }));

    // Haptic feedback for bulk action
    if ("vibrate" in navigator) {
      navigator.vibrate([50, 50, 50]);
    }

    try {
      // Batch update all tab items to served
      const allTabItemIds = itemsToServe.flatMap((item) => item.tabItemIds);
      await z.mutate(
        mutators.tabItem.updateStatusBatch({
          ids: allTabItemIds,
          status: "served",
        }),
      );

      const totalQuantity = itemsToServe.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );
      const actionDescription = categoryId
        ? `${totalQuantity} ${categoryId} items from Table ${tableNumber}`
        : `${totalQuantity} items from Table ${tableNumber}`;

      toast.success(`Served ${actionDescription}`, {
        action: {
          label: "Undo",
          onClick: async () => {
            // Undo by setting back to ready
            await z.mutate(
              mutators.tabItem.updateStatusBatch({
                ids: allTabItemIds,
                status: "ready",
              }),
            );
            toast.success("Bulk action undone");
          },
        },
      });
    } catch (error) {
      console.error("Error serving items:", error);
      toast.error("Failed to serve items");
    } finally {
      setProcessingItems((prev) => {
        const updated = { ...prev };
        for (const item of itemsToServe) {
          delete updated[item.key];
        }
        return updated;
      });
    }
  };

  // Get item counts from dedicated queries
  const itemCounts = useMemo(() => {
    return {
      byStatus: {
        prepping: preppingItems?.length || 0,
        ready: readyItems?.length || 0,
        served: 0, // Not needed for display
      },
    };
  }, [preppingItems, readyItems]);

  // Group filtered items by table and category
  const tableGroups = useMemo(() => {
    return groupItemsByTableAndCategory(orderItems);
  }, [orderItems, groupItemsByTableAndCategory]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-4 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                aria-label="Back to tables"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <ChefHat className="h-8 w-8 text-slate-700 dark:text-slate-300" />
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Kitchen
                </h1>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-2 py-3 text-center">
          <div className="py-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                aria-label="Back to tables"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <ChefHat className="h-8 w-8 text-slate-700 dark:text-slate-300" />
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {config?.name || "Restaurant"} - Kitchen
                </h1>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {orderItems.length} items • {tableGroups.length} tables
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Label htmlFor="mode-switch" className="text-sm font-medium">
                Prep ({itemCounts.byStatus.prepping || 0})
              </Label>
              <Switch
                id="mode-switch"
                checked={!showPrepMode}
                onCheckedChange={(checked) => setShowPrepMode(!checked)}
              />
              <Label htmlFor="mode-switch" className="text-sm font-medium">
                Serve ({itemCounts.byStatus.ready || 0})
              </Label>
            </div>
          </div>
        </div>
      </header>

      {/* Category Filter Bar */}
      {categoriesWithCounts.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center mr-2">
                Categories:
              </span>
              {categoriesWithCounts.map((category) => (
                <Button
                  key={category.id}
                  variant={
                    selectedCategories.includes(category.id)
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => handleCategoryToggle(category.id)}
                  className={cn(
                    "text-xs h-8 px-3 transition-all duration-200",
                    selectedCategories.includes(category.id)
                      ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                      : "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600",
                  )}
                >
                  {category.name}
                  <Badge
                    variant="secondary"
                    className={cn(
                      "ml-2 text-xs",
                      selectedCategories.includes(category.id)
                        ? "bg-blue-500 text-white border-blue-400"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
                    )}
                  >
                    {category.count}
                  </Badge>
                </Button>
              ))}
              {selectedCategories.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategories([])}
                  className="text-xs h-8 px-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-2 py-3">
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-2 space-y-2">
          {tableGroups.map((tableGroup) => (
            <Card
              key={tableGroup.tableNumber}
              className={cn(
                "bg-white dark:bg-slate-800 transition-all duration-200 break-inside-avoid mb-2",
                tableGroup.urgencyLevel === "high" &&
                  "ring-2 ring-red-500 shadow-lg",
              )}
            >
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg font-bold truncate">
                      Table {tableGroup.tableNumber}
                    </span>
                    {tableGroup.urgencyLevel === "high" && (
                      <Zap className="h-4 w-4 text-red-500 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={tableGroup.isComplete ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {tableGroup.readyItems}/{tableGroup.totalItems}
                    </Badge>
                    {tableGroup.readyItems > 0 && !showPrepMode && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkServe(tableGroup.tableNumber)}
                        className="text-xs h-6 px-2"
                        disabled={tableGroup.categories.some((cat) =>
                          cat.items.some((item) => processingItems[item.key]),
                        )}
                      >
                        {tableGroup.categories.some((cat) =>
                          cat.items.some((item) => processingItems[item.key]),
                        ) ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "All"
                        )}
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-3 pb-3">
                {tableGroup.categories.map((categoryGroup) => (
                  <div key={categoryGroup.category.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 truncate">
                        {categoryGroup.category.name}
                      </h4>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge
                          variant={
                            categoryGroup.allReady ? "default" : "secondary"
                          }
                          className="text-xs px-1"
                        >
                          {categoryGroup.readyCount}/{categoryGroup.totalCount}
                        </Badge>
                        {categoryGroup.readyCount > 0 && !showPrepMode && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleBulkServe(
                                tableGroup.tableNumber,
                                categoryGroup.category.id,
                              )
                            }
                            className="text-xs h-5 px-1"
                            disabled={categoryGroup.items.some(
                              (item) => processingItems[item.key],
                            )}
                          >
                            {categoryGroup.items.some(
                              (item) => processingItems[item.key],
                            ) ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Take"
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      {categoryGroup.items.map((item) => {
                        // Time info calculated for potential future use in UI
                        const _timeInfo = formatTimeWithUrgency(
                          item.createdAt ?? Date.now(),
                        );
                        const isLateItem = isItemLate(item);
                        const isProcessing = processingItems[item.key];

                        return (
                          <div
                            key={item.key}
                            className={cn(
                              "p-2 rounded-md transition-all duration-200",
                              "bg-slate-50 dark:bg-slate-700",
                              isLateItem &&
                                "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800",
                              isProcessing && "opacity-75 scale-[0.98]",
                            )}
                          >
                            <div className="space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-tight">
                                    {item.quantity}x {item.name}
                                  </p>
                                </div>
                              </div>

                              {item.notes && (
                                <p className="text-xs text-slate-600 dark:text-slate-400 break-words leading-tight">
                                  {item.notes}
                                </p>
                              )}

                              {item.allergies && item.allergies.length > 0 && (
                                <div className="flex gap-1 flex-wrap">
                                  {item.allergies.map((allergy) => (
                                    <Badge
                                      key={allergy}
                                      variant="destructive"
                                      className="text-xs px-1 py-0"
                                    >
                                      <AlertTriangle className="h-2 w-2 mr-1" />
                                      {allergy}
                                    </Badge>
                                  ))}
                                </div>
                              )}

                              <div className="pt-1">
                                {item.status === "prepping" && (
                                  <Button
                                    size="lg"
                                    onClick={() =>
                                      handleUpdateStatus(item, "ready")
                                    }
                                    disabled={isProcessing}
                                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg"
                                  >
                                    {isProcessing ? (
                                      <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : (
                                      <Clock className="h-6 w-6 mr-2" />
                                    )}
                                    Ready
                                  </Button>
                                )}
                                {item.status === "ready" && (
                                  <Button
                                    size="lg"
                                    onClick={() =>
                                      handleUpdateStatus(item, "served")
                                    }
                                    disabled={isProcessing}
                                    className="w-full h-16 bg-green-600 hover:bg-green-700 text-white font-bold text-lg"
                                  >
                                    {isProcessing ? (
                                      <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : (
                                      <Check className="h-6 w-6 mr-2" />
                                    )}
                                    Served
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {orderItems.length === 0 && (
          <div className="text-center py-12 px-4">
            <div className="text-slate-400 mb-4">
              <Search className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400">
                No items to {showPrepMode ? "prepare" : "serve"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                {showPrepMode
                  ? "All items are ready or served"
                  : "No items are ready to serve yet"}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
