"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { DynamicIcon, IconName } from "lucide-react/dynamic";
import { BasketItems } from "./basket-items";
import { BasketTotal } from "./basket-total";
import { AddItemsCatalog } from "./catalog";
import Link from "next/link";
import {
  Allergen,
  CategoryWithMenuItems,
  MenuItem,
} from "@/lib/manifest/types";
import { useQueryStates } from "nuqs";
import { searchParams, urlKeys } from "../search";
import { useBasket } from "../contexts/basket";
import { Badge } from "@/components/ui/badge";
import { ReconciledTable } from "@/lib/manifest/table-reconciler";

export interface AddItemsViewProps {
  onClickRecap: () => void;
  table: ReconciledTable;
  tabId: number;
  categories: CategoryWithMenuItems[];
  allMenuItems: MenuItem[];
  allergens: Allergen[];
}

export const AddItemsView = ({
  onClickRecap,
  table,
  categories,
  allergens,
  allMenuItems,
}: AddItemsViewProps) => {
  const [{ categoryId: searchParamsCategoryId, searchTerm }, setQuery] =
    useQueryStates(searchParams, {
      urlKeys,
    });

  const { count } = useBasket();

  const activeCategoryId = searchParamsCategoryId ?? categories[0].id;

  const activeCategory =
    categories.find((category) => category.id === activeCategoryId) ??
    categories[0];

  return (
    <Card className="w-full max-w-6xl shadow-lg">
      <CardHeader className="border-b bg-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "mr-4"
              )}
              href={`/tables/${table.id}`}
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <CardTitle className="text-2xl">Add Items</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Table {table.name}</p>
            </div>
          </div>
          <Badge className="text-lg py-1.5 px-3">
            <span suppressHydrationWarning>
              {count}
              {count === 1 ? " item selected" : " items selected"}
            </span>
          </Badge>
        </div>
      </CardHeader>

      {/* <SearchBox /> */}

      <div className={`grid grid-cols-1`}>
        <div className="p-4 border-b">
          <div className={`flex flex-wrap gap-2 `}>
            {categories.map((category) => (
              <Button
                variant={
                  category.id === activeCategoryId ? "default" : "outline"
                }
                key={"category-" + category.id}
                onClick={() =>
                  setQuery({ categoryId: category.id, searchTerm })
                }
                className={`flex-shrink-0 h-auto py-6 flex-grow`}
              >
                <DynamicIcon name={category.icon as IconName} />
                <span className="ml-1 capitalize text-xs sm:text-sm truncate">
                  {category.name}
                </span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid  h-full">
        {activeCategory.menuItems.length > 0 ? (
          <AddItemsCatalog
            category={activeCategory}
            items={activeCategory.menuItems}
          />
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500">
            {searchTerm
              ? "No items match your search"
              : "No items in this category"}
          </div>
        )}

        {/* Mobile Selected Items - Below the items grid */}
        <div className="border-t sm:border-t-0 border-l">
          <div className="p-3 bg-gray-50 flex justify-between items-center">
            <div className="font-medium flex items-center">
              <ClipboardList className="h-4 w-4 mr-2" />
              Selected Items ({count})
            </div>
            {/* <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            {showSelectedItems ? (
                <ChevronUp className="h-4 w-4" />
                ) : (
                    <ChevronDown className="h-4 w-4" />
                    )}
                    </Button> */}
          </div>
          <div className="p-3 lg:overflow-y-auto">
            <BasketItems
              menuItems={allMenuItems}
              allergens={allergens}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:sm-grid-cols-3"
            />
          </div>
        </div>
      </div>

      <CardFooter className="p-4 border-t bg-gray-50">
        <div className="flex justify-between items-center w-full">
          <div className="text-lg font-bold">
            Total: <BasketTotal menuItems={allMenuItems} />
          </div>
          <Button
            onClick={onClickRecap}
            className="gap-2"
            disabled={count === 0}
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            Review & Confirm
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
