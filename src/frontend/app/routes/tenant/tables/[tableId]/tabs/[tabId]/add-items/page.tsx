import { useTypedZero } from "@frontend/zero";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Redirect, useLocation } from "wouter";
import { useReconciledTableQuery } from "@/frontend/app/lib/table-reconciler";
import { mutators } from "@/mutators";
import { AddItemsView } from "./components/add-items-view";
import { RecapView } from "./components/recap-view";
import { type BasketItem, BasketProvider } from "./contexts/basket";
import { useItemsQuery } from "./hook";

export function AddItemsPage({
  params,
}: {
  params: {
    tableId: string;
    tabId: string;
  };
}) {
  const { tabId, tableId } = params;
  const z = useTypedZero();
  const [table, _tablesType] = useReconciledTableQuery(tableId);
  const [{ categories, menuItems, allergens }] = useItemsQuery();

  const [recap, setRecap] = useState(false);

  const [, setLocation] = useLocation();

  const onSubmit = useCallback(
    async (basketItems: BasketItem[]) => {
      try {
        // Batch insert all tab items in a single mutation
        await z.mutate(
          mutators.tabItem.insertBatch({
            tabID: tabId,
            items: basketItems.map((item) => ({
              menuItemID: item.item.menuItemId ?? null,
              nameOverride: item.item.nameOverride ?? null,
              priceOverride: item.item.priceOverride ?? null,
              notes: item.notes ?? null,
            })),
          }),
        );
        setLocation(`/tables/${tableId}?tid=${tabId}`);
      } catch (error) {
        console.error(error);
        toast.error("Error: " + (error as Error).message);
      }
    },
    [tabId, setLocation, tableId, z],
  );

  if (!table) return <Redirect to="/tables" />;
  if (!categories || !menuItems || !allergens) return <Redirect to="/tables" />;

  return (
    <BasketProvider>
      {recap ? (
        <RecapView
          onSubmit={onSubmit}
          onClickBack={() => setRecap(false)}
          table={table}
          categories={categories}
          allMenuItems={menuItems}
          allergens={allergens}
        />
      ) : (
        <AddItemsView
          onClickRecap={() => setRecap(true)}
          table={table}
          tabId={tabId}
          categories={categories}
          allMenuItems={menuItems}
          allergens={allergens}
        />
      )}
    </BasketProvider>
  );
}
