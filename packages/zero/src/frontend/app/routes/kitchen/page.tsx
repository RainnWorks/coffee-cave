import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  ArrowLeft,
  Search,
  Clock,
  Check,
  Loader2,
  Filter,
  Bell,
  AlertTriangle,
} from "lucide-react";
import { icons } from "lucide-react";
import { useRestaurantConfig } from "../../contexts/restaurant-config";
import { toast } from "sonner";
import { useTypedZero } from "../../lib/zero";
import { useQuery } from "@rocicorp/zero/react";
import { DateTime } from "luxon";
import { useLocation } from "wouter";
import {
  MultiSelect,
  type MultiSelectOption,
} from "../../components/ui/multi-select";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";

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
};

type StatusFilter = "prepping" | "ready" | "served";

export default function KitchenView() {
  const config = useRestaurantConfig();
  const [, setLocation] = useLocation();
  const z = useTypedZero();

  // Query for all tab items (we'll filter by status in the component)
  const [tabItems, { type: queryType }] = useQuery(
    z.query.tab_item
      .related("tab", (q) => q.related("table"))
      .related("menuItem", (q) =>
        q.related("categories", (q) => q.related("category"))
      )
      .related("allergyRestrictions", (q) => q.related("allergen"))
  );

  // Query for all categories from database
  const [categories, { type: categoriesQueryType }] = useQuery(
    z.query.category
  );
  const isLoading = queryType !== "complete";

  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<StatusFilter[]>([
    "prepping",
  ]);
  const [processingItems, setProcessingItems] = useState<
    Record<string, boolean>
  >({});
  const [showNotification, setShowNotification] = useState(false);

  // Status filter options for multi-select
  const statusOptions: MultiSelectOption[] = [
    { label: "Prepping", value: "prepping" },
    { label: "Ready to Serve", value: "ready" },
    { label: "Served", value: "served" },
  ];

  // Category filter options from database
  const categoryOptions: MultiSelectOption[] = useMemo(() => {
    if (!categories) return [];
    return categories.map((category) => {

      return {
        label: category.name,
        value: category.id,
        icon: () => <DynamicIcon name={category.icon as IconName} />  ,
      };
    });
  }, [categories]);

  // Transform tab items to kitchen items with status determination
  const allOrderItems: KitchenItem[] = useMemo(() => {
    if (!tabItems) return [];

    return tabItems.map((item) => {
      // Determine status based on readyAt and servedAt timestamps
      let status: "prepping" | "ready" | "served";
      if (item.servedAt) {
        status = "served";
      } else if (item.readyAt) {
        status = "ready";
      } else {
        status = "prepping";
      }

      return {
        id: item.id,
        name: item.nameOverride || item.menuItem?.name || "Custom Item",
        notes: item.notes || undefined,
        category: item.menuItem?.categories?.[0]?.category?.name || "Other",
        tableNumber: item.tab?.table?.name || "Unknown",
        tabId: item.tabID,
        timeOrdered: DateTime.fromMillis(item.createdAt).toLocaleString(
          DateTime.TIME_SIMPLE
        ),
        quantity: 1, // Each TabItem represents one item
        allergies:
          item.allergyRestrictions
            ?.map((ar) => ar.allergen?.name)
            .filter((name): name is string => !!name) || undefined,
        status,
      };
    });
  }, [tabItems]);

  // Filter items based on selected status filters
  const orderItems: KitchenItem[] = useMemo(() => {
    return allOrderItems.filter((item) => statusFilters.includes(item.status));
  }, [allOrderItems, statusFilters]);

  const [filteredItems, setFilteredItems] = useState<KitchenItem[]>([]);

  // Apply filters when category filters or status filters change
  useEffect(() => {
    let filtered = [...orderItems];

    // Apply category filter
    if (categoryFilters.length > 0) {
      filtered = filtered.filter((item) => {
        // Find the category ID for this item
        const itemCategoryId = categories?.find(
          (cat) => cat.name === item.category
        )?.id;
        return itemCategoryId && categoryFilters.includes(itemCategoryId);
      });
    }

    setFilteredItems(filtered);
  }, [categoryFilters, orderItems, categories]);

  // Handle back button
  const handleBack = () => {
    setLocation("/tables");
  };

  // Handle item status update
  const handleUpdateStatus = async (
    item: KitchenItem,
    newStatus: "ready" | "served" | "prepping"
  ) => {
    const itemKey = `${item.id}-${item.tabId}`;
    setProcessingItems((prev) => ({ ...prev, [itemKey]: true }));

    try {
      if (newStatus === "ready") {
        // Mark as ready (kitchen done, ready to serve)
        await z.mutate.tab_item.update({
          id: item.id,
          readyAt: Date.now(),
        });

        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);

        toast.success(`${item.name} marked as ready to serve`);
      } else if (newStatus === "served") {
        // Mark as served
        await z.mutate.tab_item.update({
          id: item.id,
          servedAt: Date.now(),
        });

        toast.success(`${item.name} marked as served`);
      } else if (newStatus === "prepping") {
        // Move back to prepping
        await z.mutate.tab_item.update({
          id: item.id,
          readyAt: null,
          servedAt: null,
        });

        toast.info(`${item.name} moved back to prepping`);
      }
    } catch (error) {
      console.error("Error updating item status:", error);
      toast.error("Failed to update item status");
    } finally {
      setProcessingItems((prev) => ({ ...prev, [itemKey]: false }));
    }
  };

  // Group items by table
  const groupItemsByTable = () => {
    const grouped: Record<string, KitchenItem[]> = {};

    filteredItems.forEach((item) => {
      const key = `Table ${item.tableNumber}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });

    return grouped;
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-6xl shadow-lg">
        <CardHeader className="border-b bg-gray-100">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              aria-label="Back to tables"
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl">Kitchen View</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <div className="py-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupedItems = groupItemsByTable();
  const hasItems = Object.keys(groupedItems).length > 0;

  return (
    <Card className="w-full max-w-6xl shadow-lg">
      <CardHeader className="border-b bg-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              aria-label="Back to tables"
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="text-2xl">
                {config?.name || "Restaurant"} - Kitchen
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {orderItems.length} active items
              </p>
            </div>
          </div>
          <div className="relative">
            {showNotification && (
              <div className="absolute -top-2 -right-2 animate-bounce">
                <Bell className="h-6 w-6 text-yellow-500" />
              </div>
            )}
            <Badge variant="outline" className="bg-gray-100 text-gray-700">
              {orderItems.length} items to prepare
            </Badge>
          </div>
        </div>
      </CardHeader>

      <div className="p-4 border-b">
        <div className="flex flex-col gap-4">
          {/* Status Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              Status Filter
            </label>
            <MultiSelect
              options={statusOptions}
              onValueChange={(values) =>
                setStatusFilters(values as StatusFilter[])
              }
              defaultValue={statusFilters}
              placeholder="Select status to show..."
              className="w-full max-w-md"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              Category Filter
            </label>
            <MultiSelect
              options={categoryOptions}
              onValueChange={(values) => setCategoryFilters(values)}
              defaultValue={categoryFilters}
              placeholder="Select categories to show..."
              className="w-full max-w-md"
            />
          </div>
        </div>
      </div>

      <CardContent className="p-6">
        {hasItems ? (
          <div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`}
          >
            {Object.entries(groupedItems).map(([tableName, items]) => (
              <div
                key={tableName}
                className="border rounded-md overflow-hidden"
              >
                <div className="bg-gray-100 p-3 border-b flex justify-between items-center">
                  <h3 className="font-bold">{tableName}</h3>
                  <Badge variant="outline" className="bg-white">
                    {items.length} items
                  </Badge>
                </div>
                <div className="divide-y">
                  {items.map((item) => {
                    const itemKey = `${item.id}-${item.tabId}`;
                    const isProcessing = processingItems[itemKey];
                    const hasAllergies =
                      item.allergies && item.allergies.length > 0;

                    return (
                      <div key={itemKey} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.name}</span>
                              {/* Status Badge */}
                              <Badge
                                variant="outline"
                                className={`flex items-center gap-1 ${
                                  item.status === "prepping"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : item.status === "ready"
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : "bg-gray-50 text-gray-700 border-gray-200"
                                }`}
                              >
                                {item.status === "prepping" && "Prepping"}
                                {item.status === "ready" && "Ready"}
                                {item.status === "served" && "Served"}
                              </Badge>
                              {hasAllergies && (
                                <Badge
                                  variant="outline"
                                  className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1"
                                >
                                  <AlertTriangle className="h-3 w-3" />
                                  Allergies
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {item.timeOrdered}
                              <span className="mx-1">•</span>
                              <span className="capitalize">
                                {item.category}
                              </span>
                              <span className="mx-1">•</span>
                              <span>Qty: {item.quantity}</span>
                            </div>
                          </div>

                          {/* Action Buttons based on status */}
                          <div className="flex gap-2">
                            {item.status === "prepping" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleUpdateStatus(item, "ready")
                                }
                                disabled={isProcessing}
                                className="whitespace-nowrap bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                              >
                                {isProcessing ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : (
                                  <Check className="h-4 w-4 mr-1" />
                                )}
                                Mark Ready
                              </Button>
                            )}

                            {item.status === "ready" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleUpdateStatus(item, "served")
                                  }
                                  disabled={isProcessing}
                                  className="whitespace-nowrap bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                                >
                                  {isProcessing ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                  ) : (
                                    <Check className="h-4 w-4 mr-1" />
                                  )}
                                  Mark Served
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleUpdateStatus(item, "prepping")
                                  }
                                  disabled={isProcessing}
                                  className="whitespace-nowrap"
                                >
                                  Back to Prep
                                </Button>
                              </>
                            )}

                            {item.status === "served" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleUpdateStatus(item, "ready")
                                }
                                disabled={isProcessing}
                                className="whitespace-nowrap"
                              >
                                Mark Ready
                              </Button>
                            )}
                          </div>
                        </div>

                        {item.notes && (
                          <div className="mt-2 bg-gray-50 border border-gray-100 p-2 rounded-md text-sm">
                            <p className="text-gray-700">{item.notes}</p>
                          </div>
                        )}

                        {hasAllergies && (
                          <div className="mt-2 bg-red-50 border border-red-100 p-2 rounded-md text-sm">
                            <p className="text-red-700 font-medium">
                              Allergies: {item.allergies?.join(", ")}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            {categoryFilters.length > 0 ? (
              <p>No items match your filters. Try adjusting your filters.</p>
            ) : (
              <p>No active orders at the moment. All items are completed!</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
