import { Button } from "@/frontend/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/frontend/app/components/ui/dialog";
import { PosInput } from "@/frontend/app/components/ui/pos-input";
import {
  useRestaurantConfig,
  useCurrencyFormatter,
  useCurrencyUtils,
} from "@/frontend/app/contexts/restaurant-config";
import type { ReconciledTable } from "@/frontend/app/lib/table-reconciler";
import { Label } from "@radix-ui/react-label";
import { SquareSplitHorizontal, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ChangeCalculator } from "./change-calculator";
import { SplitModal } from "./split-modal";
import { useTypedZero } from "@/frontend/app/lib/zero";
import { useAuth } from "@/frontend/app/AuthedZeroProvider";
import { generateId } from "@/utils/ids";
import { toast } from "sonner";

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

  const z = useTypedZero();
  const auth = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (!auth.userID) return;
    try {
      const paymentId = generateId("payment");
      z.mutateBatch(async (tx) => {
        await tx.payment.insert({
          id: paymentId,
          tableID: table.id,
          amount: paymentAmount,
          createdAt: Date.now(),
          // notes: note,
          createdByID: auth.userID!,
        });

        if (full) {
          await Promise.all(
            table.tabs
              .flatMap((tab) => tab.items.flatMap((item) => item.id))
              .map(async (tabItemID) => {
                await tx.payment_tab_item_paid.insert({
                  paymentID: paymentId,
                  tabItemID,
                });
              })
          );
        }
      });

      toast.success(`Payment ${paymentId} added successfully`);
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
