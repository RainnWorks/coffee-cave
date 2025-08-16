import { useTypedZero } from "../../../../../../lib/zero";
import { useCallback, useState } from "react";
import { AddItemsView } from "./components/add-items-view";
import { BasketProvider, useBasket, type BasketItem } from "./contexts/basket";
import { useLocation } from "wouter";
import { generateId } from "../../../../../../../../utils/ids";
import { toast } from "sonner";
import { RecapView } from "./components/recap-view";
import { useItemsQuery } from "./hook";
import { useReconciledTableQuery } from "@/frontend/app/lib/table-reconciler";
import { Redirect } from "wouter";

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
  const [table, tablesType] = useReconciledTableQuery(tableId);
  const [
    { categories, menuItems, allergens },
    { categoriesType, allergensType },
  ] = useItemsQuery();

  const [recap, setRecap] = useState(false);

  const [, setLocation] = useLocation();

  const onSubmit = useCallback(
    async (basketItems: BasketItem[]) => {
      try {
        await z.mutateBatch(async (x) => {
          await Promise.all(
            basketItems.map((item) => {
              x.tab_item.insert({
                id: generateId("tabItem"),
                createdAt: Date.now(),
                tabID: tabId,
                menuItemID: item.item.menuItemId,
                nameOverride: item.item.nameOverride,
                priceOverride: item.item.priceOverride,
                notes: item.notes,
              });
            })
          );
        });
        setLocation(`/tables/${tableId}?tid=${tabId}`);
      } catch (error) {
        console.error(error);
        toast.error("Error: " + (error as Error).message);
      }
    },
    [tabId, setLocation, tableId]
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
