"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { useRestaurantConfig } from "@/contexts/restaurant-config";
import { toast } from "sonner";
import { MenuItem } from "@/lib/manifest/types";

type OrderItem = MenuItem & {
  tableNumber: number;
  tabId: string;
  tabName: string;
};

export default function KitchenView() {
  const router = useRouter();
  const config = useRestaurantConfig();

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [processingItems, setProcessingItems] = useState<
    Record<string, boolean>
  >({});
  const [showNotification, setShowNotification] = useState(false);

  // Apply filters when search query or category filter changes
  useEffect(() => {
    let filtered = [...orderItems];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          `Table ${item.tableNumber}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (item.allergies &&
            item.allergies.some((allergy) =>
              allergy.toLowerCase().includes(searchQuery.toLowerCase())
            ))
      );
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter);
    }

    setFilteredItems(filtered);
  }, [searchQuery, categoryFilter, orderItems]);

  // Get all unique categories from order items
  const getCategories = () => {
    const categories = new Set<string>();
    orderItems.forEach((item) => categories.add(item.category));
    return ["all", ...Array.from(categories)];
  };

  // Handle back button
  const handleBack = () => {
    router.push("/tables");
  };

  // Handle item status update
  const handleUpdateStatus = async (
    item: OrderItem,
    newStatus: "done" | "not_done"
  ) => {
    const itemKey = `${item.id}-${item.tabId}`;
    setProcessingItems((prev) => ({ ...prev, [itemKey]: true }));

    try {
      await updateItemStatus(
        item.tableNumber.toString(),
        item.tabId,
        item.id,
        newStatus
      );

      // Update local state
      const updatedItems = orderItems
        .map((orderItem) => {
          if (orderItem.id === item.id && orderItem.tabId === item.tabId) {
            return { ...orderItem, status: newStatus };
          }
          return orderItem;
        })
        .filter((orderItem) => {
          // Keep items that are not marked as done
          return orderItem.id === item.id && orderItem.tabId === item.tabId
            ? newStatus !== "done"
            : true;
        });

      setOrderItems(updatedItems);

      // Show notification when item is marked as done
      if (newStatus === "done") {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      }

      toast.info(
        newStatus === "done"
          ? `${item.name} Completed`
          : `${item.name} Reopened`
      );
    } catch (error) {
      console.error("Error updating item status:", error);

      toast.error("Failed to update item status");
    } finally {
      setProcessingItems((prev) => ({ ...prev, [itemKey]: false }));
    }
  };

  // Group items by table
  const groupItemsByTable = () => {
    const grouped: Record<string, OrderItem[]> = {};

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
        <div
          className={`flex flex-col gap-2 sm:flex-row sm:gap-0 justify-between items-center`}
        >
          <div className={`flex gap-2 sm:w-1/3`}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search items, tables, allergies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  document.getElementById("category-filter")?.click()
                }
              >
                <Filter className="h-4 w-4" />
              </Button>
              <select
                id="category-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="absolute opacity-0 w-full h-full cursor-pointer"
              >
                {getCategories().map((category) => (
                  <option key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </option>
                ))}
              </select>
            </div>
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
                          <Button
                            variant={
                              item.status === "done" ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              handleUpdateStatus(
                                item,
                                item.status === "done" ? "not_done" : "done"
                              )
                            }
                            disabled={isProcessing}
                            className="whitespace-nowrap"
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <Check className="h-4 w-4 mr-1" />
                            )}
                            {item.status === "done" ? "Reopen" : "Mark Done"}
                          </Button>
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
            {searchQuery || categoryFilter !== "all" ? (
              <p>
                No items match your filters. Try adjusting your search or
                filters.
              </p>
            ) : (
              <p>No active orders at the moment. All items are completed!</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
