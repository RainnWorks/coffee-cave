"use client";

import { useCurrencyFormatter } from "@frontend/contexts/restaurant-config";
import { cn } from "@frontend/lib/utils";
import { ArrowLeft, CheckCircle2, HandPlatter, ListChecks } from "lucide-react";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { Link, Redirect } from "wouter";
import { useReconciledTableQuery } from "@/frontend/app/lib/table-reconciler";
import { buttonVariants } from "@/frontend/app/ui/button";
import { Label } from "@/frontend/app/ui/label";
import {
  Page,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/frontend/app/ui/page";
import { RadioGroup, RadioGroupItem } from "@/frontend/app/ui/radio-group";
import { PaySpecificItemsForm } from "./components/pay-specific-items-form";
import { PayTableForm } from "./components/pay-table-form";

export function PaymentView({ params }: { params: { tableId: string } }) {
  const [table] = useReconciledTableQuery(params.tableId);
  const formatCurrency = useCurrencyFormatter();

  const [paymentType, setPaymentType] = useQueryState(
    "type",
    parseAsStringEnum(["specific-amount", "items", "remaining-balance"])
      .withDefault("items")
      .withOptions({
        shallow: true,
      }),
  );

  return !table ? (
    <Redirect to={`/tables/${params.tableId}`} />
  ) : (
    <Page className="w-full shadow-lg">
      <PageHeader className="border-b bg-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href={`/tables/${table.id}`}
              aria-label="Back to table"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "mr-4",
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
                    value as "specific-amount" | "items" | "remaining-balance",
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
