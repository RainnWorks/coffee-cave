import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  ArrowLeft,
  Plus,
  Receipt,
  CreditCard,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CreateTabButton } from "./components/create-tab-button";

import { parseAsInteger, createLoader, SearchParams } from "nuqs/server";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import { DynamicIcon } from "lucide-react/dynamic";
import { RemoveTabItemButton } from "./components/remove-tab-item-button";
import { getServerManifestClient } from "@/lib/manifest/api-client/server";
import { createCurrencyFormatter } from "@/lib/currency";
import Link from "next/link";
import { groupItems } from "@/lib/basket";

export const dynamic = "force-dynamic";

export const searchParams = {
  tabId: parseAsInteger,
};

export const loadSearchParams = createLoader(searchParams, {
  urlKeys: {
    tabId: "tid",
  },
});

type PageProps = {
  params: Promise<{ tableId: number }>;
  searchParams: Promise<SearchParams>;
};

export default async function TableDetailView({
  params,
  searchParams,
}: PageProps) {
  const tableId = (await params).tableId;

  const client = await getServerManifestClient();
  const { errorMessage: configErrorMessage, result: config } =
    await client.restaurantConfig.get();

  if (!config) {
    redirect(
      "/tables?error=" +
        encodeURIComponent(configErrorMessage || "No restaurant config")
    );
  }
  const formatCurrency = createCurrencyFormatter(config);
  const { errorMessage, result, error } = await client.tables.getById(tableId);

  if (error || errorMessage || !result) {
    console.log({
      error,
      result,
      errorMessage,
    });
    redirect(
      "/tables?error=" + encodeURIComponent(errorMessage || "Unknown error")
    );
  }

  const { tabId } = await loadSearchParams(searchParams);
  const tableData = result;
  const activeTabId = tabId ?? tableData.tabs?.[0]?.id;
  const activeTab = tableData.tabs?.find((tab) => tab.id === activeTabId);

  const activeTabItems = Object.values(
    groupItems(
      activeTab?.tabItems.map((tabItem) => ({
        ...tabItem,
        menuItemId: tabItem.menuItem?.id,
      })) ?? []
    )
  );

  // const activeTabItems = Object.values(
  //   activeTab?.tabItems.reduce((acc, item) => {
  //     const itemKey = item.menuItem?.id ?? "custom-item-";
  //     const allergenKey =
  //       (item.allergyRestrictions?.length || 0) > 0
  //         ? (
  //             item.allergyRestrictions?.map((allergen) => allergen.id) ?? []
  //           ).join("-")
  //         : "";

  //     const key = itemKey + allergenKey;
  //     return {
  //       ...acc,
  //       [key]: {
  //         ...item,
  //         key,
  //         tabItemIds: [...(acc[key]?.tabItemIds || []), item.id],
  //         count: (acc[key]?.count || 0) + 1,
  //         countPaid: (acc[key]?.countPaid || 0) + (item.paid ? 1 : 0),
  //       },
  //     };
  //   }, {} as { [menuItemId: string]: TabItemsCombined }) ?? {}
  // ).toSorted((a, b) => a.name.localeCompare(b.name));

  return (
    <Card className="w-full max-w-4xl shadow-lg">
      <CardHeader className="border-b bg-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/tables"
              aria-label="Back to tables"
              className={cn(
                buttonVariants({
                  variant: "ghost",
                  size: "sm",
                }),
                "mr-4"
              )}
            >
              <ArrowLeft className="" />
            </Link>
            <div>
              <CardTitle className="text-2xl">Table {tableData.name}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {(tableData.tabs?.filter((tab) => !tab.paid) ?? []).length} open
                tabs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              className={cn("px-10 h-10", {
                "pointer-events-none opacity-50":
                  !activeTab ||
                  activeTab.tabItems.length === 0 ||
                  (activeTab.remainingBalance ?? 0) <= 0,
              })}
              variant="outline"
              disabled={!activeTab || activeTab.tabItems.length === 0}
            >
              <Receipt className="h-4 w-4" />
              Print Receipt
            </Button>
            <Link
              href={`/tables/${tableData.id}/payment`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-1 h-10"
              )}
            >
              <CreditCard className="h-4 w-4" />
              Process Payment
            </Link>
            <CreateTabButton tableId={tableData.id} />
          </div>
        </div>
      </CardHeader>

      {(tableData.tabs?.length ?? 0) > 0 && (
        <div className="flex border-b bg-gray-50 p-4 justify-between items-center gap-4">
          <div className="flex flex-col flex-1 gap-2">
            <div className="text-sm text-gray-500">Tabs</div>
            <div className="flex flex-wrap gap-2">
              {tableData.tabs?.map((tab) => {
                return (
                  <Link
                    href={`/tables/${tableData.id}?tid=${tab.id}`}
                    key={"tab-" + tab.id}
                    className={cn(
                      buttonVariants({
                        variant: activeTabId === tab.id ? "default" : "outline",
                      })
                    )}
                  >
                    {tab.name}
                    <span className="ml-1">
                      ({formatCurrency(tab.remainingBalance)})
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-sm text-gray-500">Remaining Balance</div>
            <div className="text-2xl font-bold text-blue-700">
              {formatCurrency(activeTab?.remainingBalance ?? 0)}
            </div>
            {tableData.remainingBalance > 0 && (
              <div className="text-xs text-gray-500">
                {formatCurrency(tableData.total - tableData.remainingBalance)}{" "}
                paid of {formatCurrency(tableData.total)}
              </div>
            )}
          </div>
        </div>
      )}

      <CardContent className="p-6">
        {activeTab ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">{activeTab.name}</h3>
                <div className="mt-1 flex items-center text-sm text-gray-500">
                  <Clock className="mr-1 h-3.5 w-3.5" />
                  <span>{activeTab.createdAt.toLocaleString()}</span>
                  <span className="mx-2">•</span>
                  <span>{activeTab.tabItems?.length ?? 0} items</span>
                </div>
              </div>
            </div>

            <div className="rounded-md border">
              <div className="flex items-center justify-between border-b bg-gray-50 p-3">
                <h4 className="font-medium">Items</h4>
                <div className="flex gap-2">
                  {/* {activeTab.payments.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1"
                      onClick={() => setShowPaymentHistoryOverlay(true)}
                    >
                      <History className="h-3.5 w-3.5" />
                      Payment History
                    </Button>
                  )} */}
                  <Link
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "h-8 gap-1"
                    )}
                    href={`/tables/${tableData.id}/tabs/${activeTab.id}/add-items`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Items
                  </Link>
                </div>
              </div>

              <div className="divide-y">
                {activeTabId && activeTabItems.length > 0 ? (
                  activeTabItems.map((item) => {
                    const itemTotal = item.price * item.count;
                    console.log(item);
                    const hasAllergies =
                      item.allergyRestrictions &&
                      item.allergyRestrictions.length > 0;
                    const countPaid = item.items.filter((i) => i.paid).length;
                    return (
                      <div
                        key={item.key}
                        className="flex flex-col p-3 border-b last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="rounded-md bg-gray-100 p-1.5">
                              <DynamicIcon name={item.icon} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{item.name}</span>
                                {countPaid > 0 && (
                                  <Badge
                                    variant={
                                      countPaid === item.count
                                        ? "outline"
                                        : "secondary"
                                    }
                                    className={
                                      countPaid === item.count
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : "bg-blue-50 text-blue-700 border-blue-200"
                                    }
                                  >
                                    {countPaid === item.count
                                      ? "Paid"
                                      : "Partial"}
                                  </Badge>
                                )}
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
                              <div className="text-sm text-gray-500">
                                {formatCurrency(item.price)} × {item.count}
                              </div>
                              {countPaid > 0 && (
                                <div className="text-xs text-gray-500">
                                  {formatCurrency(countPaid)} paid of{" "}
                                  {formatCurrency(item.count)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="font-medium">
                                {formatCurrency(itemTotal)}
                              </div>
                              {countPaid > 0 && (
                                <div className="text-xs text-gray-500">
                                  {formatCurrency(countPaid * item.price)} paid
                                  of {formatCurrency(item.count * item.price)}
                                </div>
                              )}
                            </div>
                            <RemoveTabItemButton
                              disabled={countPaid > 0}
                              tabItemId={item.items[0].id}
                              tabId={activeTabId}
                              tableId={tableId}
                            />
                          </div>
                        </div>

                        {/* Display notes if available */}
                        {item.notes && (
                          <div className="ml-10 mt-1 text-sm bg-gray-50 p-2 rounded-md text-gray-600 italic">
                            Note: {item.notes}
                          </div>
                        )}

                        {/* Display allergies if available */}
                        {hasAllergies && (
                          <div className="ml-10 mt-1 text-sm bg-red-50 p-2 rounded-md text-red-600 flex items-start gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium">Allergies:</span>{" "}
                              {item
                                .allergyRestrictions!.map(
                                  (allergen) => allergen.name
                                )
                                .join(", ")}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    No items in this tab yet
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">
            {(tableData.tabs?.length ?? 0) > 0 ? (
              <p>All tabs are closed or paid. Create a new tab to continue.</p>
            ) : (
              <p>No tabs are currently open for this table.</p>
            )}
            <div className="mt-4">
              <CreateTabButton tableId={tableId} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
