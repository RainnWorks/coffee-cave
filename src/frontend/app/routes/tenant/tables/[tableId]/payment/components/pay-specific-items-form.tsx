import { useTypedZero, useZeroAuth } from "@frontend/zero";
import { Label } from "@radix-ui/react-label";
import {
  HandCoins,
  Loader2,
  Minus,
  Plus,
  SquareSplitHorizontal,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useCurrencyFormatter } from "@/frontend/app/contexts/restaurant-config";
import { type GroupedItem, groupItems } from "@/frontend/app/lib/basket";
import {
  generateTabName,
  type ReconciledTabItem,
  type ReconciledTable,
} from "@/frontend/app/lib/table-reconciler";
import { cn, partition } from "@/frontend/app/lib/utils";
import { Button } from "@/frontend/app/ui/button";
import { Card, CardHeader } from "@/frontend/app/ui/card";
import { Textarea } from "@/frontend/app/ui/textarea";
import { mutators } from "@/mutators";
import { SplitModal } from "./split-modal";

export const PaySpecificItemsForm = ({ table }: { table: ReconciledTable }) => {
  const z = useTypedZero();
  const auth = useZeroAuth();
  const formatCurrency = useCurrencyFormatter();
  const [note, setNote] = useState("");
  const [_, setLocation] = useLocation();

  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const addItem = (item: GroupedItem<ReconciledTabItem>) => {
    const possibleIdsToAdd = item.items
      .filter((item) => !item.paid)
      .find((item) => !selectedItems.includes(item.id))?.id;
    if (typeof possibleIdsToAdd !== "undefined")
      setSelectedItems((ids) => [...ids, possibleIdsToAdd]);
  };

  const removeItem = (item: GroupedItem<ReconciledTabItem>) => {
    const firstIdToRemove = selectedItems.findIndex((id) =>
      item.items.some((item) => item.id === id),
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
    if (!auth.principalId) return;
    try {
      // Pay for selected items (creates payment, links items, auto-closes fully paid tabs)
      await z.mutate(
        mutators.payment.payItems({
          tableID: table.id,
          amount: processAmount,
          tabItemIds: selectedItems,
          notes: note ?? null,
        }),
      );

      toast.success("Payment added successfully");
      setLocation(`/tables/${table.id}`);
    } catch (error) {
      toast.error("Failed to add payment: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    table.id,
    selectedItems,
    processAmount,
    note,
    setLocation,
    isSubmitting,
    auth.principalId,
    z,
  ]);

  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [splitModalProps, setSplitModalProps] = useState<
    | {
        totalToSplit: number;
        tabItemIds: string[];
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
                tab.tabItems.map((item) => item.id),
              ) ?? [],
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
                      (item) =>
                        item.menuItem?.categories?.[0]?.category?.name ??
                        "Custom",
                    ),
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
                      group.items.some((item) => item.id === id),
                    );
                    const quantity = groupSelectedItems.length;
                    const [unpaidItems, paidItems] = partition(
                      (item) => !item.paid,
                      group.items,
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
                                  quantity > 0 && "font-bold text-blue-700",
                                )}
                              >
                                {group.menuItem?.name ?? "Custom"}
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
                                  quantity > 0 && "text-blue-700",
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
                  "text-gray-400 font-medium line-through",
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
                  : "font-bold text-blue-700",
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
              setLocation(`/tables/${table.id}`);
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
