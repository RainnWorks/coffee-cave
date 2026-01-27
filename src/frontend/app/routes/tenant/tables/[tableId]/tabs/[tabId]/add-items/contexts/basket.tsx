"use client";

import {
  type GroupedItem,
  generateItemId,
  groupItems,
} from "@frontend/lib/basket";
import { DateTime } from "luxon";
import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { Category, MenuItem } from "@/schema";

// Type for our OrderItem that will be used in the context

export type MenuDerivedItem = {
  menuItemId: string;
  nameOverride?: undefined;
  priceOverride?: number;
};

export type CustomItem = {
  menuItemId: undefined;
  nameOverride: string;
  priceOverride: number;
};

export const getItemPrice = (
  menuItems: MenuItem[],
  item: MenuDerivedItem | CustomItem,
) => {
  if (item.menuItemId !== undefined) {
    return (
      item.priceOverride ||
      menuItems.find((mi) => mi.id === item.menuItemId)?.price ||
      0
    );
  }
  return item.priceOverride || 0;
};

export type OrderItemId = string;
export type OrderItem = {
  category?: Category;
  item: MenuDerivedItem | CustomItem;
  allergenIds: string[];
  notes?: string;
};

export type BasketItem = OrderItem & {
  addedAt: DateTime;
};

export type GroupedBasketItem = GroupedItem<BasketItem>;

// Context state type
interface BasketContextState {
  items: GroupedBasketItem[];
  list: BasketItem[];
  count: number;
  addItem: (orderItem: OrderItem) => void;
  removeItem: (keyOrItem: string | OrderItem) => void;
  clearItems: () => void;
  toggleItemAllergen: (itemIndex: number, allergenId: string) => void;
  setItemAllergenIds: (itemIndex: number, allergenIds: string[]) => void;
  setItemNotes: (itemIndex: number, notes: string) => void;
  updateItem: (itemIndex: number, item: BasketItem) => void;
}

// Create the context with default values
const BasketContext = createContext<BasketContextState>({
  items: [],
  list: [],
  count: 0,
  addItem: () => {},
  removeItem: () => {},
  clearItems: () => {},
  toggleItemAllergen: () => {},
  setItemAllergenIds: () => {},
  setItemNotes: () => {},
  updateItem: () => {},
});

// Custom hook to use the context
export const useBasket = () => useContext(BasketContext);

// Provider component
interface BasketProviderProps {
  children: ReactNode;
}

export const BasketProvider: React.FC<BasketProviderProps> = ({ children }) => {
  const [basketItems, setBasketItems] = useState<BasketItem[]>([]);

  // Add an item to the order
  const addItem = useCallback((item: OrderItem) => {
    setBasketItems((prevItems) => [
      ...prevItems,
      { ...item, addedAt: DateTime.now() },
    ]);
  }, []);

  // Remove an item from the order by its key
  const removeItem = useCallback(
    (keyOrItem: string | OrderItem) => {
      const keyToRemove =
        typeof keyOrItem === "string" ? keyOrItem : generateItemId(keyOrItem);
      const itemIndex = basketItems.findLastIndex(
        (item) => generateItemId(item) === keyToRemove,
      );
      if (itemIndex !== -1) {
        setBasketItems((prevItems) =>
          prevItems.filter((_, index) => index !== itemIndex),
        );
      }
    },
    [basketItems],
  );

  // Clear all items
  const clearItems = useCallback(() => {
    setBasketItems([]);
  }, []);

  // Convert flat list to grouped items for the context value
  const groupedItems = useMemo(
    () =>
      Object.values(
        groupItems(
          basketItems.map((item) => ({
            ...item,
            menuItemId: item.item.menuItemId,
          })),
        ),
      )
        .sort((a, b) =>
          a.addedAt < b.addedAt ? -1 : a.addedAt > b.addedAt ? 1 : 0,
        )
        .reverse(),
    [basketItems],
  );

  const updateItem = useCallback(
    (itemIndex: number, item: BasketItem) => (prevItems: BasketItem[]) => {
      return [
        ...prevItems.slice(0, itemIndex),
        { ...item, id: generateItemId(item) },
        ...prevItems.slice(itemIndex + 1),
      ];
    },
    [],
  );

  const toggleItemAllergen = useCallback(
    (itemIndex: number, allergenId: string) => {
      const item = basketItems[itemIndex];
      if (!item) return;

      const allergenIds = item.allergenIds.includes(allergenId)
        ? item.allergenIds.filter((id) => id !== allergenId)
        : [...item.allergenIds, allergenId];
      updateItem(itemIndex, {
        ...item,
        allergenIds,
      });
    },
    [updateItem, basketItems],
  );

  const setItemAllergenIds = useCallback(
    (itemIndex: number, allergenIds: string[]) => {
      setBasketItems((prevItems) =>
        updateItem(itemIndex, { ...prevItems[itemIndex], allergenIds })(
          prevItems,
        ),
      );
    },
    [updateItem],
  );

  const setItemNotes = useCallback(
    (itemIndex: number, notes: string) => {
      setBasketItems((prevItems) =>
        updateItem(itemIndex, { ...prevItems[itemIndex], notes })(prevItems),
      );
    },
    [updateItem],
  );

  const contextValue = {
    items: groupedItems,
    list: basketItems,
    count: basketItems.length,
    addItem,
    removeItem,
    clearItems,
    toggleItemAllergen,
    setItemAllergenIds,
    setItemNotes,
    updateItem,
  };

  return (
    <BasketContext.Provider value={contextValue}>
      {children}
    </BasketContext.Provider>
  );
};
