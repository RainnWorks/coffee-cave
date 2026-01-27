import { useTypedZero, useZeroAuth } from "@frontend/zero";
import { Label } from "@radix-ui/react-label";
import { Loader2, SquareSplitHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  useCurrencyFormatter,
  useCurrencyUtils,
  useRestaurantConfig,
} from "@/frontend/app/contexts/restaurant-config";
import type { ReconciledTable } from "@/frontend/app/lib/table-reconciler";
import { Button } from "@/frontend/app/ui/button";
import { PosInput } from "@/frontend/app/ui/pos-input";
import { mutators } from "@/mutators";
import { SplitModal } from "./split-modal";

export const PayTableForm = ({
  table,
  full,
}: {
  table: ReconciledTable;
  full?: boolean;
}) => {
  const config = useRestaurantConfig();
  const [, setLocation] = useLocation();
  const formatCurrency = useCurrencyFormatter();
  const { minorToMajor, majorToMinor } = useCurrencyUtils();
  const [paymentAmount, setPaymentAmount] = useState(
    full ? table.remainingBalance : 0,
  );
  const [customPaymentAmount, setCustomPaymentAmount] = useState<string>(
    minorToMajor(paymentAmount).toString(),
  );
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

  const z = useTypedZero();
  const auth = useZeroAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (!auth.principalId) return;
    try {
      // Get all tab item IDs if full payment
      const tabItemIds = full
        ? table.tabs.flatMap((tab) => tab.items.map((item) => item.id))
        : [];

      // Pay for items (creates payment, links items, auto-closes fully paid tabs)
      await z.mutate(
        mutators.payment.payItems({
          tableID: table.id,
          amount: paymentAmount,
          tabItemIds,
          notes: null,
        }),
      );

      toast.success("Payment added successfully");
      setLocation(`/tables/${table.id}`);
    } catch (error) {
      toast.error("Failed to add payment: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [splitModalProps, setSplitModalProps] = useState<
    | {
        totalToSplit: number;
        tabItemIds: string[];
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
      <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {splitModalProps && (
          <SplitModal
            onPaymentSuccess={() => {
              setLocation(`/tables/${table.id}`);
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
      {/* <Dialog
        open={showChangeCalculator}
        onOpenChange={(open) => {
          if (!open) {
            console.log("called");
            setLocation(`/tables/${table.id}`);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Calculator</DialogTitle>
          </DialogHeader>
          <ChangeCalculator amountDue={paymentAmount} />
        </DialogContent>
      </Dialog> */}
    </div>
  );
};
