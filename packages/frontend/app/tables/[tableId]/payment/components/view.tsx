"use client";

import type React from "react";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Page, PageContent, PageHeader, PageTitle } from "@/components/ui/page";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  HandCoins,
  HandPlatter,
  ListChecks,
  Loader2,
  Minus,
  Plus,
  SquareSplitHorizontal,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  useCurrencyFormatter,
  useCurrencyUtils,
  useRestaurantConfig,
} from "@/contexts/restaurant-config";
import {
  generateTabName,
  ReconciledTabItem,
  ReconciledTable,
} from "@/lib/manifest/table-reconciler";
import { GroupedItem, groupItems } from "@/lib/basket";
import { cn, partition } from "@/lib/utils";
import Link from "next/link";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { Card, CardHeader } from "@/components/ui/card";
import { addPayment } from "../actions/add-payment";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { SplitModal } from "./split-modal";
import { PosInput } from "@/components/ui/pos-input";
import {
  DialogHeader,
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChangeCalculator } from "./change-calculator";

export const PaySpecificItemsForm = ({ table }: { table: ReconciledTable }) => {
  const formatCurrency = useCurrencyFormatter();
  const [note, setNote] = useState("");
  const { replace } = useRouter();

  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const addItem = (item: GroupedItem<ReconciledTabItem>) => {
    const possibleIdsToAdd = item.items
      .filter((item) => !item.paid)
      .find((item) => !selectedItems.includes(item.id))?.id;
    if (typeof possibleIdsToAdd !== "undefined")
      setSelectedItems((ids) => [...ids, possibleIdsToAdd]);
  };

  const removeItem = (item: GroupedItem<ReconciledTabItem>) => {
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const processAmount = Math.min(paymentAmount, table.remainingBalance ?? 0);

  const submitPayment = useCallback(async () => {
    setIsSubmitting(true);
    if (isSubmitting) return;
    try {
      const { error, result } = await addPayment({
        tableId: table.id,
        tabItemIds: selectedItems,
        paidAmount: processAmount,
        notes: note,
      });

      if (error) {
        toast.error(error);
        return;
      } else {
        toast.success(`Payment ${result!.id} added successfully`);
        replace(`/tables/${table.id}`);
      }
    } catch (error) {
      toast.error("Failed to add payment: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }, [table.id, selectedItems, processAmount, note, replace, isSubmitting]);

  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [splitModalProps, setSplitModalProps] = useState<
    | {
        totalToSplit: number;
        tabItemIds: number[];
        defaultSplitCount: number;
      }
    | undefined
  >(undefined);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Remaining Items</h2>
        <Button
          className=" p-6 sm:px-8"
          onClick={() =>
            setSelectedItems(
              table.tabs?.flatMap((tab) =>
                tab.tabItems.map((item) => item.id)
              ) ?? []
            )
          }
        >
          Select Whole Table
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {table.tabs?.map((tab) => {
          // Skip tabs with no unpaid items
          const hasUnpaidItems = tab.tabItems.some((item) => !item.paid);
          if (!hasUnpaidItems) return null;
          const groupedItemMap = groupItems(tab.tabItems);
          const groupedItems = Object.values(groupedItemMap);
          return (
            <Card
              key={tab.id}
              className="border rounded-md lg:max-h-[500px] lg:overflow-y-auto"
            >
              <CardHeader className="bg-gray-50 p-3 flex flex-row justify-between items-center">
                <h3 className="font-medium">
                  {generateTabName(
                    tab.tabItems.map(
                      (item) => item.menuItem?.categories?.[0]?.name ?? "Custom"
                    )
                  )}
                </h3>
                <Button
                  variant="outline"
                  onClick={() =>
                    setSelectedItems(tab.tabItems.map((item) => item.id))
                  }
                >
                  Select Tab
                </Button>
              </CardHeader>
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
                            <span className="min-w-8 text-center">
                              {quantity}
                            </span>
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
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end">
        <div className="p-3">
          {processAmount !== paymentAmount ? (
            <div>
              <div
                className={cn(
                  "text-xl tabular-nums text-right",
                  "text-gray-400 font-medium line-through"
                )}
              >
                {formatCurrency(paymentAmount)}
              </div>
              <div className="text-right text-sm text-gray-500">
                Only {formatCurrency(table.remainingBalance ?? 0)} remaining
              </div>
            </div>
          ) : null}
          <div>
            <div
              className={cn(
                "text-3xl tabular-nums text-right",
                processAmount <= 0
                  ? "text-gray-400 font-medium"
                  : "font-bold text-blue-700"
              )}
            >
              {formatCurrency(processAmount)}
            </div>
            <div className="text-right text-lg text-gray-500">Subtotal</div>
          </div>
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

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {splitModalProps && (
          <SplitModal
            open={isSplitModalOpen}
            tableId={table.id}
            onPaymentSuccess={() => {
              replace(`/tables/${table.id}`);
            }}
            onOpenChange={(open) => {
              if (!open) setIsSplitModalOpen(false);
            }}
            dialogContentProps={{
              onAnimationEnd: () => {
                if (!isSplitModalOpen) setSplitModalProps(undefined);
              },
            }}
            {...splitModalProps}
          />
        )}
        <Button
          variant="outline"
          className="text-lg p-6 sm:px-8"
          onClick={() => {
            setSplitModalProps({
              defaultSplitCount: table.seats,
              totalToSplit: processAmount,
              tabItemIds: selectedItems,
            });
            setIsSplitModalOpen(true);
          }}
          disabled={!processAmount || processAmount <= 0 || isSubmitting}
        >
          <SquareSplitHorizontal className="mr-2 h-6! w-6!" />
          Split Bill
        </Button>
        <Button
          className="text-lg p-6 sm:px-8"
          onClick={submitPayment}
          disabled={!processAmount || processAmount <= 0 || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <HandCoins className="mr-2 h-6! w-6!" />
              Record Payment
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export const PayTableForm = ({
  table,
  full,
}: {
  table: ReconciledTable;
  full?: boolean;
}) => {
  const config = useRestaurantConfig();
  const { push, replace } = useRouter();
  const formatCurrency = useCurrencyFormatter();
  const { minorToMajor, majorToMinor } = useCurrencyUtils();
  const [paymentAmount, setPaymentAmount] = useState(
    full ? table.remainingBalance : 0
  );
  const [customPaymentAmount, setCustomPaymentAmount] = useState<string>(
    minorToMajor(paymentAmount).toString()
  );
  const [showChangeCalculator, setShowChangeCalculator] = useState(false);
  useEffect(() => {
    if (full) {
      setPaymentAmount(table.remainingBalance);
      setCustomPaymentAmount(minorToMajor(table.remainingBalance).toString());
    } else {
      setPaymentAmount(0);
      setCustomPaymentAmount("0");
    }
  }, [full, table.remainingBalance, minorToMajor]);

  const numberFormatter = new Intl.NumberFormat(config.currencyLocale, {
    style: "currency",
    currency: config.currencyCode,
    minimumFractionDigits: 0,
  });

  const isOvercharging = paymentAmount > table.remainingBalance;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // TODO: Add payment processing logic
      // const { error } = await addPayment({
      //   tableId: table.id,
      //   paidAmount: processAmount,
      //   tabItemIds: [],
      // });
      // if (error) {
      //   toast.error("Error processing payment: " + error);
      //   return;
      // }

      setShowChangeCalculator(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [splitModalProps, setSplitModalProps] = useState<
    | {
        totalToSplit: number;
        tabItemIds: number[];
        defaultSplitCount: number;
      }
    | undefined
  >(undefined);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        <Label htmlFor="payment-amount">Payment Amount</Label>
        <PosInput
          disabled={isSubmitting || full}
          value={customPaymentAmount.toString()}
          onChange={(value) => setCustomPaymentAmount(value)}
          onChangeNumeric={(value) => setPaymentAmount(majorToMinor(value))}
          formatter={numberFormatter}
        />
      </div>
      {isOvercharging ? <div>Overcharging</div> : null}
      <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {splitModalProps && (
          <SplitModal
            onPaymentSuccess={() => {
              replace(`/tables/${table.id}`);
            }}
            open={isSplitModalOpen}
            tableId={table.id}
            onOpenChange={(open) => {
              if (!open) setIsSplitModalOpen(false);
            }}
            dialogContentProps={{
              onAnimationEnd: () => {
                if (!isSplitModalOpen) setSplitModalProps(undefined);
              },
            }}
            {...splitModalProps}
          />
        )}
        <Button
          variant="outline"
          className="text-lg p-6 sm:px-8"
          onClick={() => {
            setSplitModalProps({
              defaultSplitCount: table.seats,
              totalToSplit: paymentAmount,
              tabItemIds: [],
            });
            setIsSplitModalOpen(true);
          }}
          disabled={!paymentAmount || paymentAmount <= 0 || isSubmitting}
        >
          <SquareSplitHorizontal className="mr-2 h-6! w-6!" />
          Split Bill
        </Button>
        <Button
          className="h-12 text-lg"
          onClick={handleSubmit}
          disabled={!paymentAmount || paymentAmount <= 0 || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            `Process ${formatCurrency(paymentAmount)} Payment`
          )}
        </Button>
      </div>
      <Dialog
        open={showChangeCalculator}
        onOpenChange={(open) => {
          if (!open) {
            console.log("called");
            push(`/tables/${table.id}`);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Calculator</DialogTitle>
          </DialogHeader>
          <ChangeCalculator amountDue={paymentAmount} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export function PaymentView({ table }: { table: ReconciledTable }) {
  const formatCurrency = useCurrencyFormatter();

  const [paymentType, setPaymentType] = useQueryState(
    "type",
    parseAsStringEnum(["specific-amount", "items", "remaining-balance"])
      .withDefault("items")
      .withOptions({
        shallow: true,
      })
  );

  return (
    <Page className="w-full shadow-lg">
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
            <div className="text-base text-gray-500">Remaining Balance</div>
            <div className="text-2xl font-bold text-red-700">
              {formatCurrency(table.remainingBalance)}
            </div>
          </div>
        </div>
      </PageHeader>

      <PageContent className="p-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Left Column - Payment Options */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-medium">Payment Type</h3>
              <RadioGroup
                value={paymentType}
                onValueChange={(value) =>
                  setPaymentType(
                    value as "specific-amount" | "items" | "remaining-balance"
                  )
                }
                className="space-y-2"
              >
                <Label
                  htmlFor="payment-items"
                  className="flex items-center space-x-2 border rounded-md p-3 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="items" id="payment-items" />
                    <ListChecks className="h-4 w-4 text-purple-600" />
                    <span>Pay Selected Items</span>
                  </div>
                </Label>
                <Label
                  htmlFor="specific-amount"
                  className="flex items-center space-x-2 border rounded-md p-3 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem
                      value="specific-amount"
                      id="specific-amount"
                    />
                    <HandPlatter className="h-4 w-4 text-blue-600" />
                    <span>Pay Custom Amount</span>
                  </div>
                </Label>
                <Label
                  htmlFor="remaining-balance"
                  className="flex items-center space-x-2 border rounded-md p-3 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem
                      value="remaining-balance"
                      id="remaining-balance"
                    />
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Pay Remaining Balance</span>
                  </div>
                </Label>
              </RadioGroup>
            </div>

            <div>
              {/* {paymentType === "" && <SplitBillForm table={table} />} */}
              {(paymentType === "specific-amount" ||
                paymentType === "remaining-balance") && (
                <PayTableForm
                  full={paymentType === "remaining-balance"}
                  table={table}
                />
              )}
              {paymentType === "items" && (
                <PaySpecificItemsForm table={table} />
              )}
            </div>
          </div>

          {/* <div className="space-y-3">
            <h3 className="font-medium">Paid items</h3>
            <div className="border rounded-md md:overflow-y-auto">
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
          </div> */}

          {/* Right Column - Items */}
        </div>
      </PageContent>
    </Page>
  );
}
