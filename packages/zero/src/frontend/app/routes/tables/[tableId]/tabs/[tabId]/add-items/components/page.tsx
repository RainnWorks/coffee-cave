"use client";

import { ReconciledTable } from "@/lib/manifest/table-reconciler";
import {
  CategoryWithMenuItems,
  Allergen,
  MenuItem,
} from "@/lib/manifest/types";
import { useCallback, useMemo, useState } from "react";
import { AddItemsView } from "./add-items-view";
import { RecapView } from "./recap-view";
import { useBasket } from "../contexts/basket";
import { addItems } from "../actions/add-items";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface AddItemsPageProps {
  table: ReconciledTable;
  tabId: number;
  categories: CategoryWithMenuItems[];
  allergens: Allergen[];
}
export default function AddItemsPageView({
  table,
  tabId,
  categories,
  allergens,
}: AddItemsPageProps) {
  const [recap, setRecap] = useState(false);

  const allMenuItems = useMemo(
    () => [
      ...new Map<number, MenuItem>(
        categories
          .map((category) => category.menuItems)
          .flat()
          .map((pos) => [pos.id, pos])
      ).values(),
    ],
    [categories]
  );

  const { replace } = useRouter();
  const { list } = useBasket();

  const onSubmit = useCallback(async () => {
    try {
      await addItems(tabId, JSON.parse(JSON.stringify(list)));
      replace(`/tables/${table.id}?tid=${tabId}`);
    } catch (error) {
      console.error(error);
      toast.error("Error: " + (error as Error).message);
    }
  }, [tabId, list, replace, table.id]);

  return recap ? (
    <RecapView
      onSubmit={onSubmit}
      onClickBack={() => setRecap(false)}
      table={table}
      categories={categories}
      allMenuItems={allMenuItems}
      allergens={allergens}
    />
  ) : (
    <AddItemsView
      onClickRecap={() => setRecap(true)}
      table={table}
      tabId={tabId}
      categories={categories}
      allMenuItems={allMenuItems}
      allergens={allergens}
    />
  );
}
