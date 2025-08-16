import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button, buttonVariants } from "../../../components/ui/button";
import {
  ArrowLeft,
  Receipt,
  CreditCard,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { CreateTabButton } from "./components/create-tab-button";

import { cn } from "../../../lib/utils";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { RemoveTabItemButton } from "./components/remove-tab-item-button";
import { groupItems } from "../../../lib/basket";
import { DateTime } from "luxon";
import { AddItemsLink } from "./components/add-items-link";
import { CloseTabButton } from "./components/close-tab-button";
import { Switch } from "../../../components/ui/switch";
import { CloseTableButton } from "./components/close-table-button";
import { Lock } from "lucide-react";
import { useReconciledTableQuery } from "../../../lib/table-reconciler";
import { Link, Redirect } from "wouter";
import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";
import {
  useCurrencyFormatter,
  useRestaurantConfig,
} from "../../../contexts/restaurant-config";

type PageProps = {
  params: { tableId: string };
};

export default function TableDetailView({ params }: PageProps) {
  const tableId = params.tableId;

  const { timeZone } = useRestaurantConfig();
  const formatCurrency = useCurrencyFormatter();
  const [{ tabId, showClosedTabs }, setQueryStates] = useQueryStates(
    {
      tabId: parseAsString,
      showClosedTabs: parseAsBoolean.withDefault(false),
    },
    {
      urlKeys: {
        tabId: "tid",
        showClosedTabs: "sct",
      },
    }
  );
  const [table] = useReconciledTableQuery(tableId);

  if (!table) return <Redirect to="/tables" />;

  const activeTabId = tabId ?? table.tabs?.[0]?.id;
  const activeTab = table.tabs?.find((tab) => tab.id === activeTabId);

  if (activeTab?.closed && !showClosedTabs) {
    const firstUnclosedTab = table.tabs?.find((tab) => !tab.closed);
    setQueryStates({
      tabId: firstUnclosedTab?.id,
    });
  }

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
    <Card className="w-full lg:max-w-4xl shadow-lg">
      <CardHeader className="border-b bg-gray-100 p-0">
        <div className="flex sm:items-center sm:justify-between flex-col sm:flex-row gap-6 p-6">
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
              <CardTitle className="text-2xl">Table {table.name}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {(table.tabs?.filter((tab) => !tab.paid) ?? []).length} open
                tabs
              </p>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <CloseTableButton
              tableId={table.id}
              locked={table.remainingBalance > 0}
            />
            <Button
              className={cn("flex-shrink-0 flex-grow px-10 h-10", {
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
              href={`/tables/${table.id}/payment`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "flex-shrink-0 flex-grow gap-1 h-10"
              )}
            >
              <CreditCard className="h-4 w-4" />
              Process Payment
            </Link>
            <CreateTabButton
              className="flex-shrink-0 flex-grow"
              tableId={table.id}
            />
          </div>
        </div>
      </CardHeader>

      {(table.tabs?.length ?? 0) > 0 && (
        <div className="flex border-b bg-gray-50 justify-between items-center gap-4">
          <div className="flex flex-col flex-1 gap-2 p-4 ">
            <div className="flex space-x-4 items-center h-10">
              <div className="text-sm text-gray-500">Tabs</div>
              <Link
                className="flex items-center gap-1 text-sm"
                href={`/tables/${
                  table.id
                }?tid=${activeTabId}&sct=${!showClosedTabs}`}
              >
                <Switch checked={!!showClosedTabs}></Switch>
                Show Closed Tabs
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {table.tabs
                ?.filter((tab) => (showClosedTabs ? true : !tab.closed))
                .map((tab) => {
                  return (
                    <Button
                      variant={activeTabId === tab.id ? "default" : "outline"}
                      onClick={() => {
                        setQueryStates({
                          tabId: tab.id,
                          showClosedTabs: !!showClosedTabs,
                        });
                      }}
                      key={"tab-" + tab.id}
                      className={cn("relative")}
                    >
                      {tab.closed && (
                        <Lock
                          className={cn(
                            "absolute -top-1 -right-1 h-4 w-4",
                            tab.closed
                              ? activeTabId === tab.id
                                ? "text-yellow-600"
                                : "text-gray-300"
                              : ""
                          )}
                        />
                      )}
                      {tab.name}
                      <span className="tabular-nums">
                        ({formatCurrency(tab.remainingBalance)})
                      </span>
                    </Button>
                  );
                })}
            </div>
          </div>

          <div className="flex flex-col gap-2 p-4 border-l">
            <div className="text-sm text-gray-500">Remaining Balance</div>
            <div className="text-2xl font-bold text-red-700 tabular-nums text-center">
              {formatCurrency(
                table.total - (table.total - table.remainingBalance)
              )}
            </div>
            {table.remainingBalance > 0 && (
              <div className="text-xs text-gray-500">
                <span className="tabular-nums">
                  {formatCurrency(table.total - table.remainingBalance)}
                </span>{" "}
                paid of{" "}
                <span className="tabular-nums">
                  {formatCurrency(table.total)}
                </span>
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
                <h3 className="text-lg font-medium">
                  {activeTab.name}
                  {activeTab.closed ? " (Closed)" : ""}
                </h3>
                <div className="mt-1 flex items-center text-sm text-gray-500">
                  <Clock className="mr-1 h-3.5 w-3.5" />
                  <span>
                    {DateTime.fromMillis(activeTab.createdAt)
                      .setZone(timeZone)
                      .toLocaleString(DateTime.TIME_SIMPLE)}
                  </span>
                  <span className="mx-2">•</span>
                  <span>{activeTab.tabItems?.length ?? 0} items</span>
                </div>
              </div>
            </div>

            <div className="rounded-md border">
              <div className="flex items-center justify-between border-b bg-gray-50 p-3">
                <h4 className="font-medium">Items</h4>
                <div className="flex gap-2">
                  {!activeTab.closed ? (
                    <>
                      <CloseTabButton
                        tableId={tableId}
                        tabId={activeTab.id}
                        locked={
                          activeTab?.tabItems.some((item) => !item.paid) ??
                          false
                        }
                      />
                      <AddItemsLink
                        tableId={tableId}
                        tabId={activeTab.id}
                        locked={activeTab.locked ?? false}
                      />
                    </>
                  ) : null}
                </div>
              </div>

              <div className="divide-y">
                {activeTabId && activeTabItems.length > 0 ? (
                  activeTabItems.map((item) => {
                    const itemTotal = item.price * item.count;
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
                              <DynamicIcon
                                name={
                                  item.menuItem?.categories?.[0].category
                                    ?.icon as IconName
                                }
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {item.menuItem?.name}
                                </span>
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
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatCurrency(item.price)} × {item.count}
                              </div>
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
                                  (allergen) => allergen?.allergen?.name
                                )
                                .filter((name) => name)
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
            {(table.tabs?.length ?? 0) > 0 ? (
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
