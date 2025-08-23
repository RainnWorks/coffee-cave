"use client";

import { CardContent } from "@frontend/components/ui/card";
import { useBasket } from "../contexts/basket";
import { useCurrencyFormatter } from "@frontend/contexts/restaurant-config";
import type { Category, MenuItem } from "../hook";
import { AddMenuItemButton } from "./menu-item-buttons";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";

export type AddItemsCatalogProps = React.ComponentProps<"div"> & {
  category: Category;
  items: MenuItem[];
};

export const AddItemsCatalog = ({
  items,
  className,
  category,
  ...props
}: AddItemsCatalogProps) => {
  const { items: basketItems } = useBasket();
  const formatCurrency = useCurrencyFormatter();
  return (
    <div className={className} {...props}>
      <CardContent className="p-4 overflow-auto">
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3`}
        >
          {items.map((item) => {
            const menuBasketItem = basketItems.find(
              (basketItem) => basketItem.item.menuItemId === item.id
            );
            const isSelected = !!menuBasketItem;
            return (
              <div
                key={item.id}
                className={`border rounded-md p-4 flex flex-col ${
                  isSelected ? "border-blue-500 bg-blue-50" : ""
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-gray-500">
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                  <DynamicIcon name={category.icon as IconName} />
                </div>

                <div className="flex items-end justify-between mt-4 self-end flex-1">
                  <div className="flex items-center">
                    <AddMenuItemButton category={category} menuItem={item} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </div>
  );
};
