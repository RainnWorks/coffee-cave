"use client";

import { useCurrencyFormatter } from "@frontend/contexts/restaurant-config";
import { cn } from "@frontend/lib/utils";
import { useTypedZero } from "@frontend/zero";
import { CheckCircle2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/frontend/app/ui/button";
import { Checkbox } from "@/frontend/app/ui/checkbox";
import {
  Dialog,
  DialogContent,
  type DialogContentProps,
  DialogFooter,
  DialogHeader,
  type DialogProps,
  DialogTitle,
} from "@/frontend/app/ui/dialog";
import { Label } from "@/frontend/app/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/frontend/app/ui/tooltip";
import { mutators } from "@/mutators";

export function calculateSplitAmount(
  total: number,
  splitCount: number,
  splitPart: number,
): number {
  return (total / splitCount) * splitPart;
}

interface PaymentPart {
  id: number;
  amount: number;
  status: "Pending" | "Completed";
}

export interface SplitModalProps extends DialogProps {
  tableId: string;
  totalToSplit: number;
  tabItemIds: string[];
  note?: string;
  defaultSplitCount: number;
  dialogContentProps?: DialogContentProps;
  onPaymentSuccess?: () => void;
}

export const SplitModal = ({
  tableId,
  totalToSplit,
  tabItemIds,
  note,
  defaultSplitCount,
  dialogContentProps,
  onPaymentSuccess,
  onOpenChange,
  ...props
}: SplitModalProps) => {
  const z = useTypedZero();
  const formatCurrency = useCurrencyFormatter();

  const [splitCount, setSplitCount] = useState(defaultSplitCount);
  const [splitPart, setSplitPart] = useState(defaultSplitCount / 2);
  const [paymentParts, setPaymentParts] = useState<PaymentPart[]>([]);

  // Initialize or update payment parts when split count changes
  useEffect(() => {
    setPaymentParts((prevParts) => {
      const newParts: PaymentPart[] = [];

      // Calculate individual part amount with proper rounding
      const baseAmount = totalToSplit / splitCount;
      let totalAllocated = 0;

      for (let i = 1; i <= splitCount; i++) {
        // For the last part, adjust to ensure total equals original amount
        const amount =
          i === splitCount
            ? totalToSplit - totalAllocated
            : Math.round(baseAmount * 100) / 100;

        totalAllocated += amount;

        // Try to preserve existing part data if available
        const existingPart = prevParts.find((p) => p.id === i);

        newParts.push({
          id: i,
          amount,
          status: existingPart?.status || "Pending",
        });
      }

      return newParts;
    });
  }, [splitCount, totalToSplit]);

  const handleSplitCountChange = (count: number) => {
    setSplitCount(count);
    setSplitPart((prev) => (prev > count ? count : prev));
  };

  const handleSplitPartChange = (part: number) => {
    setSplitPart(part);
  };

  const paymentAmount = useMemo(() => {
    const amount = calculateSplitAmount(totalToSplit, splitCount, splitPart);
    return amount;
  }, [splitCount, splitPart, totalToSplit]);

  const selectedParts = useMemo(() => {
    const incompleteParts = paymentParts.filter(
      (part) => part.status !== "Completed",
    );
    return incompleteParts.slice(0, splitPart).map((part) => part.id);
  }, [paymentParts, splitPart]);

  const maxParts = useMemo(() => {
    return paymentParts.filter((part) => part.status !== "Completed").length;
  }, [paymentParts]);

  const hasCompletedSomePayments = useMemo(() => {
    return paymentParts.some((part) => part.status === "Completed");
  }, [paymentParts]);
  const hasCompletedAllPayments = useMemo(() => {
    return paymentParts.every((part) => part.status === "Completed");
  }, [paymentParts]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitPayment = useCallback(async () => {
    setIsSubmitting(true);
    if (isSubmitting) return;
    try {
      // Pay for items (creates payment, links items, auto-closes fully paid tabs)
      await z.mutate(
        mutators.payment.payItems({
          tableID: tableId,
          amount: totalToSplit,
          tabItemIds,
          notes: note ?? null,
        }),
      );

      toast.success("Payment added successfully");
      onPaymentSuccess?.();
    } catch (error) {
      toast.error("Failed to add payment: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    tableId,
    tabItemIds,
    totalToSplit,
    note,
    onPaymentSuccess,
    z,
  ]);

  const [cancelConfirmation, setCancelConfirmation] = useState(false);
  const onClickCancel = useCallback(() => {
    if (!hasCompletedSomePayments) {
      onOpenChange?.(false);
      return;
    }
    if (!cancelConfirmation) {
      setCancelConfirmation(true);
      const timer = setTimeout(() => {
        setCancelConfirmation(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
    onOpenChange?.(false);
  }, [cancelConfirmation, hasCompletedSomePayments, onOpenChange]);

  const nextPaymentWillSubmit = useMemo(() => {
    return (
      paymentParts.filter((part) => part.status !== "Completed").length ===
      splitPart
    );
  }, [paymentParts, splitPart]);

  const onPartPaid = useCallback(() => {
    let shouldSubmit = false;
    setPaymentParts((prev) => {
      const newPaymentParts = prev.map((part) =>
        selectedParts.includes(part.id)
          ? ({
              ...part,
              status: "Completed",
            } as const)
          : part,
      );
      const newMaxParts = newPaymentParts.filter(
        (part) => part.status !== "Completed",
      ).length;
      setSplitPart((prev) => Math.min(prev, newMaxParts));
      shouldSubmit = newMaxParts === 0;

      return newPaymentParts;
    });
    if (shouldSubmit) {
      submitPayment();
    }
  }, [selectedParts, submitPayment]);

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open && hasCompletedSomePayments) return;
        onOpenChange?.(open);
      }}
      {...props}
    >
      <DialogContent
        {...dialogContentProps}
        className="sm:max-w-[550px]"
        aria-describedby="Split parts dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-xl">
            Split {formatCurrency(totalToSplit)} Payment
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Split in</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSplitCountChange(splitCount - 1)}
                    disabled={splitCount <= 2 || hasCompletedSomePayments}
                  >
                    -
                  </Button>
                  <div className="w-10 text-center">{splitCount}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSplitCountChange(splitCount + 1)}
                    disabled={hasCompletedSomePayments}
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
                    disabled={splitPart >= maxParts}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
            <div className="border rounded-md flex-1">
              <div className="text-sm font-medium text-gray-700 p-3 border-b bg-gray-50">
                Payment Parts
              </div>
              <div className="max-h-[250px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr className="text-xs text-gray-500 border-b">
                      <th className="p-2 text-left font-medium">Select</th>
                      <th className="p-2 text-left font-medium">Part</th>
                      <th className="p-2 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentParts.map((part) => (
                      <tr
                        key={part.id}
                        className={cn(
                          "border-b last:border-0 text-sm",
                          selectedParts.includes(part.id) && "bg-blue-50",
                          part.status === "Completed" &&
                            "bg-gray-50 text-gray-500",
                        )}
                      >
                        <td className="p-2">
                          {part.status === "Completed" ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Checkbox
                              checked={selectedParts.includes(part.id)}
                              disabled
                            />
                          )}
                        </td>
                        <td className="p-2">
                          Part {part.id} of {splitCount}
                        </td>
                        <td className="p-2 text-right tabular-nums font-medium">
                          {formatCurrency(part.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Parts Table */}

        <div className="flex flex-row gap-6">
          {/* Left: Payments made so far */}
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Total paid
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-blue-700 font-semibold tabular-nums">
                {formatCurrency(
                  paymentParts
                    .filter((part) => part.status === "Completed")
                    .map((part) => part.amount)
                    .reduce((a, b) => a + b, 0),
                )}
              </div>
            </div>
          </div>
          {/* Right: Current payment summary */}
          <div className="flex-1">
            <div className="text-right text-3xl font-bold text-blue-700 tabular-nums">
              {formatCurrency(paymentAmount)}
            </div>
            <div className="text-right text-lg text-gray-500">
              {splitPart}/{splitCount} parts
            </div>
          </div>
        </div>
        <DialogFooter className="flex gap-3">
          {!hasCompletedSomePayments ? (
            <Button
              variant="outline"
              className="flex-1 h-14 text-base"
              onClick={onClickCancel}
            >
              Cancel
            </Button>
          ) : (
            <Tooltip open={cancelConfirmation}>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  className="flex-1 h-14 text-base"
                  disabled={isSubmitting}
                  onClick={onClickCancel}
                >
                  {cancelConfirmation ? "Are you sure?" : "Close"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  You will need to manually record the payments already made
                </p>
              </TooltipContent>
            </Tooltip>
          )}
          {nextPaymentWillSubmit || hasCompletedAllPayments ? (
            <Button
              className="flex-1 h-14 text-base"
              disabled={isSubmitting}
              onClick={submitPayment}
              variant="default"
            >
              Record Payments
            </Button>
          ) : (
            <Button
              className="flex-1 h-14 text-base"
              disabled={!selectedParts.length}
              onClick={onPartPaid}
              variant="outline"
            >
              Next Payment
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
