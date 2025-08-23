"use client";

import { Button } from "@frontend/components/ui/button";
import { cn } from "@frontend/lib/utils";
import { ArrowLeft, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@frontend/components/ui/badge";
import { Separator } from "@frontend/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@frontend/components/ui/tooltip";
import {
  type BasketItem,
  getItemPrice,
  type GroupedBasketItem,
  useBasket,
} from "../contexts/basket";
import { useCurrencyFormatter } from "@frontend/contexts/restaurant-config";
import {
  Page,
  PageHeader,
  PageTitle,
  PageFooter,
} from "@frontend/components/ui/page";
import { useState } from "react";
import type { Category, MenuItem, Allergen } from "../hook";
import type { ReconciledTable } from "@/frontend/app/lib/table-reconciler";

// Component for the order recap page
export function RecapView({
  onClickBack,
  onSubmit,
  table,
  categories,
  allMenuItems,
  allergens,
}: {
  onSubmit: (basketItems: BasketItem[]) => Promise<void>;
  onClickBack: () => void;
  table: ReconciledTable;
  categories: Category[];
  allMenuItems: MenuItem[];
  allergens: Allergen[];
}) {
  const [isLoading, setIsLoading] = useState(false);

  const { items: basketItems, list, clearItems } = useBasket();
  const onClickSubmit = () => {
    setIsLoading(true);
    if (isLoading) return;
    onSubmit(list)
      .then(clearItems)
      .catch((error) => {
        console.error("Error submitting order:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const formatCurrency = useCurrencyFormatter();

  const itemsByCategory = Object.values(
    basketItems.reduce(
      (acc, item) => {
        const categoryId = item.category?.id ?? "custom";
        return {
          ...acc,
          [categoryId]: {
            id: categoryId,
            category: categories.find((cat) => cat.id === categoryId),
            items: [...(acc[categoryId]?.items || []), item],
            totalCount: (acc[categoryId]?.totalCount || 0) + item.count,
          },
        };
      },
      {} as Record<
        string | "custom",
        {
          id: string | number;
          category: Category | undefined;
          items: GroupedBasketItem[];
          totalCount: number;
        }
      >
    )
  );
  // Calculate total
  const total = basketItems.reduce((sum, item) => {
    return sum + getItemPrice(allMenuItems, item.item) * item.count;
  }, 0);

  // Calculate total item count
  const totalItemCount = basketItems.reduce((sum, item) => sum + item.count, 0);

  return (
    <TooltipProvider>
      <Page className="w-full max-w-6xl shadow-lg">
        <PageHeader className="border-b bg-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                disabled={isLoading}
                variant="ghost"
                size="sm"
                className={cn("mr-4")}
                onClick={onClickBack}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <PageTitle className="text-2xl">Order Recap</PageTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Table 1 · {table.seats} seats{" "}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge className="text-lg py-1.5 px-3">
                {totalItemCount} {totalItemCount === 1 ? "item" : "items"}
              </Badge>
            </div>
          </div>
        </PageHeader>

        <div className="p-4">
          <div className="space-y-4">
            {itemsByCategory.map(({ id, category, items, totalCount }) => (
              <div key={`list-${id}`}>
                <h3 className="font-medium text-lg mb-3 flex items-center">
                  <span>{category?.name}</span>
                  <span className="text-sm ml-2 text-gray-500">
                    ({totalCount} items)
                  </span>

                  {/* Integrated status indicator */}
                  {totalCount < table.seats && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="ml-2 flex items-center text-amber-500">
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Not all guests have {category?.name?.toLowerCase()}{" "}
                          items
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {totalCount >= table.seats && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="ml-2 flex items-center text-green-500">
                          <CheckCircle className="h-4 w-4" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          All guests have {category?.name?.toLowerCase()} items
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </h3>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {items.map((item) => {
                    const menuItem = allMenuItems.find(
                      (mi) => mi.id === item.item.menuItemId
                    );
                    if (!menuItem) return null;

                    // Get allergens for this item
                    const itemAllergens = allergens.filter((allergen) =>
                      item.allergenIds.includes(allergen.id)
                    );

                    return (
                      <div
                        key={item.key}
                        className="border rounded-md p-3 flex flex-col justify-center"
                      >
                        <div className="flex flex-col">
                          <div className="flex justify-between items-center flex-1">
                            <div className="flex flex-col justify-center flex-1">
                              <div className="font-medium">{menuItem.name}</div>

                              {/* Display allergens and notes */}
                              {itemAllergens.length > 0 && (
                                <div>
                                  <div className="text-xs text-gray-500">
                                    Allergies
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {itemAllergens.map((allergen) => {
                                      return (
                                        <Badge
                                          key={
                                            item.key +
                                            "-allergen-" +
                                            allergen.id
                                          }
                                          className={
                                            "cursor-pointer bg-red-100 hover:bg-red-200 text-red-800 border-red-200 text-xs"
                                          }
                                        >
                                          {allergen.name}
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center">
                              <Badge
                                variant="outline"
                                className="mr-3 text-base px-3 py-1 h-8 min-w-[36px] flex items-center justify-center"
                              >
                                {item.count}
                              </Badge>
                              <div className="text-right">
                                <div>
                                  {formatCurrency(
                                    getItemPrice(allMenuItems, item.item) *
                                      item.count
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatCurrency(
                                    getItemPrice(allMenuItems, item.item)
                                  )}{" "}
                                  each
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Expanded notes (visible by default) */}
                        {item.notes && (
                          <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            <span className="font-medium">Notes:</span>{" "}
                            {item.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <Separator className="mt-4" />
              </div>
            ))}
          </div>
        </div>

        <PageFooter className="p-4 border-t bg-gray-50">
          <div className="flex justify-between items-center w-full">
            <div className="text-lg font-bold">
              Total: {formatCurrency(total)}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClickBack}
                className="gap-2"
                disabled={isLoading}
              >
                Edit Order
              </Button>
              <Button
                className="gap-2"
                onClick={onClickSubmit}
                disabled={isLoading}
              >
                Confirm Order
              </Button>
            </div>
          </div>
        </PageFooter>
      </Page>
    </TooltipProvider>
  );
}
