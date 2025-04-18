"use client";

import { useCurrencyFormatter } from "@/contexts/restaurant-config";
import { getItemPrice, useBasket } from "../contexts/basket";
import { MenuItem } from "@/lib/manifest/types";

export interface BasketTotalProps {
  menuItems: MenuItem[];
}

export const BasketTotal = ({ menuItems }: BasketTotalProps) => {
  const { items } = useBasket();
  const formatCurrency = useCurrencyFormatter();
  const totalPrice = items.reduce((total, item) => {
    return total + item.count * getItemPrice(menuItems, item.item);
  }, 0);
  return (
    <span>
      {formatCurrency(totalPrice)}
    </span>
  );
};
