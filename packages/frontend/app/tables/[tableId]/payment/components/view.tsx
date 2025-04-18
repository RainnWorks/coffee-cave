"use client";

import type React from "react";

import { useMemo, useState } from "react";
import { Page, PageContent, PageHeader, PageTitle } from "@/components/ui/page";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  SplitSquareVertical,
  ListChecks,
  Users,
  Loader2,
  Minus,
  Plus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  useCurrencyFormatter,
  useRestaurantConfig,
} from "@/contexts/restaurant-config";
import {
  generateTabName,
  ReconciledTable,
} from "@/lib/manifest/table-reconciler";
import { GroupedItem, groupItems } from "@/lib/basket";
import { TabItem } from "@/lib/manifest/types";
import { cn, partition } from "@/lib/utils";
import Link from "next/link";
import { parseAsStringEnum, useQueryState } from "nuqs";

const getCurrencySymbol = (locale: string, currency: string) =>
  (0)
    .toLocaleString(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    .replace(/\d/g, "")
    .trim();

export const PaySpecificItemsForm = ({ table }: { table: ReconciledTable }) => {
  const config = useRestaurantConfig();
  const formatCurrency = useCurrencyFormatter();
  const [note, setNote] = useState("");

  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const addItem = (item: GroupedItem<TabItem>) => {
    const possibleIdsToAdd = item.items.find(
      (item) => !selectedItems.includes(item.id)
    )?.id;
    if (typeof possibleIdsToAdd !== "undefined")
      setSelectedItems((ids) => [...ids, possibleIdsToAdd]);
  };

  const removeItem = (item: GroupedItem<TabItem>) => {
    const firstIdToRemove = selectedItems.findIndex((id) =>
      item.items.some((item) => item.id === id)
    );
    if (firstIdToRemove === -1) return;
    setSelectedItems((prev) => {
      const newArray = [...prev];
      newArray.splice(firstIdToRemove, 1);
      return newArray;
    });
  };

  const paymentAmount = useMemo(() => {
    return selectedItems.reduce((total, id) => {
      const item = table.tabs
        ?.find((tab) => tab.tabItems.some((item) => item.id === id))
        ?.tabItems.find((item) => item.id === id);
      return total + (item?.price ?? 0);
    }, 0);
  }, [selectedItems, table]);

  return (
    <div className="space-y-3">
      <h3 className="font-medium">Unpaid Items</h3>
      <div className="border rounded-md max-h-[500px] overflow-y-auto">
        {table.tabs?.map((tab) => {
          // Skip tabs with no unpaid items
          const hasUnpaidItems = tab.tabItems.some((item) => !item.paid);
          if (!hasUnpaidItems) return null;
          const groupedItemMap = groupItems(tab.tabItems);
          const groupedItems = Object.values(groupedItemMap);
          return (
            <div key={tab.id} className="border-b last:border-b-0">
              <div className="bg-gray-50 p-3 font-medium">
                {generateTabName(
                  tab.tabItems.map(
                    (item) => item.menuItem?.categories?.[0]?.name ?? "Custom"
                  )
                )}
              </div>
              <div className="divide-y">
                {groupedItems
                  .filter((group) => group.items.some((item) => !item.paid))
                  .map((group) => {
                    const groupSelectedItems = selectedItems.filter((id) =>
                      group.items.some((item) => item.id === id)
                    );
                    const quantity = groupSelectedItems.length;
                    const [unpaidItems, paidItems] = partition(
                      (item) => !item.paid,
                      group.items
                    );
                    const unpaidCount = unpaidItems.length;
                    const paidCount = paidItems.length;
                    const amountPaid =
                      (group.priceOverride || group.price) * paidCount;
                    const canSelectMore = (quantity ?? 0) < unpaidCount;
                    const selectedPrice =
                      (group.priceOverride || group.price) * quantity;
                    const canSelectLess = (quantity ?? 0) > 0;
                    return (
                      <div key={group.key} className="p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex justify-between items-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-12 w-12 p-0"
                              onClick={() => removeItem(group)}
                              disabled={!canSelectLess}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-12 text-center">{quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-12 w-12 p-0"
                              onClick={() => addItem(group)}
                              disabled={!canSelectMore}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <Label
                            htmlFor={`item-${group.key}`}
                            className="flex flex-1 justify-between items-center"
                          >
                            <div>
                              <div
                                className={cn(
                                  "font-medium text-base",
                                  quantity > 0 && "font-bold text-blue-700"
                                )}
                              >
                                {group.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatCurrency(group.price)} ×{" "}
                                {group.count - paidCount}
                              </div>
                            </div>
                            <div className="text-right">
                              <div
                                className={cn(
                                  "text-gray-400 font-medium",
                                  quantity > 0 && "text-blue-700"
                                )}
                              >
                                {formatCurrency(selectedPrice)}
                              </div>
                              {amountPaid > 0 && (
                                <div className="text-xs text-gray-500">
                                  {formatCurrency(amountPaid)} already paid
                                </div>
                              )}
                            </div>
                          </Label>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>

      <Label htmlFor="payment-amount">Payment Amount</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
          {getCurrencySymbol(config.currencyLocale, config.currencyCode)}
        </span>
        <Input
          id="payment-amount"
          type="text"
          value={paymentAmount}
          className="pl-8 text-lg font-bold"
          disabled
        />
      </div>

      <div className="space-y-3">
        <h3 className="font-medium">Note (Optional)</h3>
        <Textarea
          placeholder="Add a note about this payment..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="resize-none"
          rows={3}
        />
      </div>

      <Button
        className="w-full h-12 text-lg"
        // onClick={handleProcessPayment}
        // disabled={
        //   !paymentAmount ||
        //   Number.parseFloat(paymentAmount) <= 0 ||
        //   isProcessing ||
        //   (paymentType === "tab" && !selectedTabId) ||
        //   (paymentType === "items" && Object.keys(selectedItems).length === 0)
        // }
      >
        {false ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          `Process ${formatCurrency(paymentAmount)} Payment`
        )}
      </Button>
    </div>
  );
};

export const PayTabForm = ({ table }: { table: ReconciledTable }) => {
  const config = useRestaurantConfig();
  const formatCurrency = useCurrencyFormatter();
  const [note, setNote] = useState("");
  const [selectedTabId, setSelectedTabId] = useState<number | null>(null);

  const paymentAmount = useMemo(() => {
    const selectedTab = table.tabs?.find((tab) => tab.id === selectedTabId);
    return selectedTab?.remainingBalance ?? 0;
  }, [selectedTabId, table]);

  return (
    <div className="space-y-3">
      <h3 className="font-medium">Select Tab to Pay</h3>
      <div className="space-y-2">
        {table.tabs?.map((tab) => {
          const tabRemaining = tab.remainingBalance ?? 0;
          if (tabRemaining <= 0) return null;

          return (
            <div
              key={tab.id}
              className={`border rounded-md p-3 cursor-pointer hover:bg-gray-50 ${
                selectedTabId === tab.id ? "border-blue-500 bg-blue-50" : ""
              }`}
              onClick={() => setSelectedTabId(tab.id)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">
                    {generateTabName(
                      tab.tabItems.map(
                        (item) =>
                          item.menuItem?.categories?.[0]?.name ?? "Custom"
                      )
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {tab.tabItems.length} items • Opened{" "}
                    {tab.createdAt.setZone(config.timeZone).toLocaleString()}
                  </div>
                </div>
                <div className="font-bold text-blue-700">
                  {formatCurrency(tabRemaining)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Label htmlFor="payment-amount">Payment Amount</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
          {getCurrencySymbol(config.currencyLocale, config.currencyCode)}
        </span>
        <Input
          id="payment-amount"
          type="text"
          value={paymentAmount}
          className="pl-8 text-lg font-bold"
          disabled
        />
      </div>

      <div className="space-y-3">
        <h3 className="font-medium">Note (Optional)</h3>
        <Textarea
          placeholder="Add a note about this payment..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="resize-none"
          rows={3}
        />
      </div>

      <Button
        className="w-full h-12 text-lg"
        // onClick={handleProcessPayment}
        // disabled={
        //   !paymentAmount ||
        //   Number.parseFloat(paymentAmount) <= 0 ||
        //   isProcessing ||
        //   (paymentType === "tab" && !selectedTabId) ||
        //   (paymentType === "items" && Object.keys(selectedItems).length === 0)
        // }
      >
        {false ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          `Process ${formatCurrency(paymentAmount)} Payment`
        )}
      </Button>
    </div>
  );
};

export const PayTableForm = ({ table }: { table: ReconciledTable }) => {
  const config = useRestaurantConfig();
  const formatCurrency = useCurrencyFormatter();
  const [paymentAmount, setPaymentAmount] = useState(table.remainingBalance);
  const [note, setNote] = useState("");
  return (
    <div className="space-y-3">
      <Label htmlFor="payment-amount">Payment Amount</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
          {getCurrencySymbol(config.currencyLocale, config.currencyCode)}
        </span>
        <Input
          id="payment-amount"
          type="text"
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(Number(e.target.value))}
          className="pl-8 text-lg font-bold"
          disabled
        />
      </div>

      <div className="space-y-3">
        <h3 className="font-medium">Note (Optional)</h3>
        <Textarea
          placeholder="Add a note about this payment..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="resize-none"
          rows={3}
        />
      </div>

      <Button
        className="w-full h-12 text-lg"
        // onClick={handleProcessPayment}
        // disabled={
        //   !paymentAmount ||
        //   Number.parseFloat(paymentAmount) <= 0 ||
        //   isProcessing ||
        //   (paymentType === "tab" && !selectedTabId) ||
        //   (paymentType === "items" && Object.keys(selectedItems).length === 0)
        // }
      >
        {false ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          `Process ${formatCurrency(paymentAmount)} Payment`
        )}
      </Button>
    </div>
  );
};

// Calculate split amount based on total, number of parts, and parts to pay
export function calculateSplitAmount(
  total: number,
  splitCount: number,
  splitPart: number
): number {
  return (total / splitCount) * splitPart;
}

export const SplitBillForm = ({ table }: { table: ReconciledTable }) => {
  const [splitCount, setSplitCount] = useState(table.seats);
  const [splitPart, setSplitPart] = useState(table.seats / 2);
  const [note, setNote] = useState("");
  const formatCurrency = useCurrencyFormatter();

  const handleSplitCountChange = (count: number) => {
    setSplitCount(count);
    setSplitPart((prev) => (prev > count ? count : prev));
  };

  const handleSplitPartChange = (part: number) => {
    setSplitPart(part);
  };

  const paymentAmount = useMemo(() => {
    const amount = calculateSplitAmount(
      table.remainingBalance,
      splitCount,
      splitPart
    );
    return amount;
  }, [splitCount, splitPart, table]);

  return (
    <div className="space-y-4 border rounded-md p-4">
      <h3 className="font-medium">Split Options</h3>

      <div className="space-y-2">
        <Label>Split in</Label>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSplitCountChange(splitCount - 1)}
            disabled={splitCount <= 2}
          >
            -
          </Button>
          <div className="w-10 text-center">{splitCount}</div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSplitCountChange(splitCount + 1)}
          >
            +
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Pay</Label>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSplitPartChange(splitPart - 1)}
            disabled={splitPart <= 1}
          >
            -
          </Button>
          <div className="w-10 text-center">{splitPart}</div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSplitPartChange(splitPart + 1)}
            disabled={splitPart >= splitCount}
          >
            +
          </Button>
        </div>
        <div className="text-sm text-gray-500">
          Paying {splitPart} of {splitCount} parts
        </div>
      </div>

      <div className="bg-gray-50 p-3 rounded-md">
        <div className="flex items-center gap-2 mb-1">
          <Users className="h-4 w-4 text-gray-500" />
          <span className="font-medium">Payment Amount</span>
        </div>
        <div className="text-xl font-bold">{formatCurrency(paymentAmount)}</div>
        <div className="text-sm text-gray-500">
          {formatCurrency(paymentAmount / splitCount)} per part
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-medium">Note (Optional)</h3>
        <Textarea
          placeholder="Add a note about this payment..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="resize-none"
          rows={3}
        />
      </div>

      <Button
        className="w-full h-12 text-lg"
        // onClick={handleProcessPayment}
        // disabled={
        //   !paymentAmount ||
        //   Number.parseFloat(paymentAmount) <= 0 ||
        //   isProcessing ||
        //   (paymentType === "tab" && !selectedTabId) ||
        //   (paymentType === "items" && Object.keys(selectedItems).length === 0)
        // }
      >
        {false ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          `Process ${formatCurrency(paymentAmount)} Payment`
        )}
      </Button>
    </div>
  );
};

export function PaymentView({ table }: { table: ReconciledTable }) {
  const formatCurrency = useCurrencyFormatter();

  const [paymentType, setPaymentType] = useQueryState(
    "type",
    parseAsStringEnum(["full", "split", "items", "tab"])
      .withDefault("full")
      .withOptions({
        shallow: true,
      })
  );

  return (
    <Page className="w-full max-w-4xl shadow-lg">
      <PageHeader className="border-b bg-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href={`/tables/${table.id}`}
              aria-label="Back to table"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "mr-4"
              )}
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <PageTitle className="text-2xl">Process Payment</PageTitle>
              <p className="text-sm text-gray-500 mt-1">
                Table {table.name} • {table.tabs?.length ?? 0} tabs
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total Remaining</div>
            <div className="text-xl font-bold text-blue-700">
              {formatCurrency(table.remainingBalance)}
            </div>
          </div>
        </div>
      </PageHeader>

      <PageContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Payment Options */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-medium">Payment Type</h3>
              <RadioGroup
                value={paymentType}
                onValueChange={(value) =>
                  setPaymentType(value as "full" | "split" | "items" | "tab")
                }
                className="space-y-2"
              >
                <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="full" id="payment-full" />
                  <Label
                    htmlFor="payment-full"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Pay Table</span>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="tab" id="payment-tab" />
                  <Label
                    htmlFor="payment-tab"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <span>Pay Tab</span>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="split" id="payment-split" />
                  <Label
                    htmlFor="payment-split"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <SplitSquareVertical className="h-4 w-4 text-blue-600" />
                    <span>Split Bill</span>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="items" id="payment-items" />
                  <Label
                    htmlFor="payment-items"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <ListChecks className="h-4 w-4 text-purple-600" />
                    <span>Pay Selected Items</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {paymentType === "tab" && <PayTabForm table={table} />}
            {paymentType === "split" && <SplitBillForm table={table} />}
            {paymentType === "full" && <PayTableForm table={table} />}
            {paymentType === "items" && <PaySpecificItemsForm table={table} />}
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">All Tabs</h3>
            <div className="border rounded-md max-h-[500px] overflow-y-auto">
              {table.tabs?.map((tab) => {
                const groupedTabItemMap = groupItems(tab.tabItems);
                const groupedTabItems = Object.values(groupedTabItemMap);
                return (
                  <div key={tab.id} className="border-b last:border-b-0">
                    <div className="bg-gray-50 p-3 flex justify-between items-center">
                      <div className="font-medium">
                        {generateTabName(
                          tab.tabItems.flatMap(
                            (item) =>
                              item.menuItem?.categories.map(
                                (category) => category.name
                              ) ?? []
                          )
                        )}
                      </div>
                      <div className="font-bold text-blue-700">
                        {formatCurrency(tab.remainingBalance)}
                      </div>
                    </div>
                    <div className="divide-y">
                      {groupedTabItems.map((group) => {
                        const paidItems = group.items
                          .map((item) => item.paid)
                          .filter(Boolean);
                        const status =
                          paidItems.length === group.count
                            ? "paid"
                            : paidItems.length > 0
                            ? "partial"
                            : "unpaid";
                        const amountPaid =
                          (group.priceOverride ?? group.price) *
                          paidItems.length;
                        const remainingBalance =
                          (group.priceOverride ?? group.price) * group.count -
                          amountPaid;
                        return (
                          <div
                            key={group.key}
                            className="p-3 flex justify-between items-center"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {group.name}
                                </span>
                                {status !== "unpaid" && (
                                  <Badge
                                    variant={
                                      status === "paid"
                                        ? "outline"
                                        : "secondary"
                                    }
                                    className={
                                      status === "paid"
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : "bg-blue-50 text-blue-700 border-blue-200"
                                    }
                                  >
                                    {status === "paid" ? "Paid" : "Partial"}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatCurrency(
                                  group.priceOverride ?? group.price
                                )}{" "}
                                × {group.count}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                {formatCurrency(remainingBalance)}
                              </div>
                              {amountPaid > 0 && (
                                <div className="text-xs text-gray-500">
                                  {formatCurrency(amountPaid)} already paid
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column - Items */}
        </div>
      </PageContent>
    </Page>
  );
}
