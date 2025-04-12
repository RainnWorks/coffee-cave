"use client"

import { useState } from "react"
import type { Tab } from "@/components/tables-view"
import { Button } from "@/components/ui/button"
import { X, CreditCard, Banknote, Receipt, Clock } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PaymentHistoryOverlayProps {
  tab: Tab
  onClose: () => void
}

export function PaymentHistoryOverlay({ tab, onClose }: PaymentHistoryOverlayProps) {
  const [activeView, setActiveView] = useState<string>("payments")

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return dateString
  }

  // Get payment method icon
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "card":
        return <CreditCard className="h-4 w-4 text-blue-600" />
      case "cash":
        return <Banknote className="h-4 w-4 text-green-600" />
      default:
        return <Receipt className="h-4 w-4 text-purple-600" />
    }
  }

  // Calculate total paid amount
  const calculateTotalPaid = () => {
    return tab.payments.reduce((total, payment) => total + payment.amount, 0)
  }

  // Calculate total tab amount
  const calculateTabTotal = () => {
    return tab.items.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  // Calculate remaining balance
  const calculateRemainingBalance = () => {
    return tab.items.reduce((total, item) => {
      const itemTotal = item.price * item.quantity
      const remainingAmount = itemTotal - item.paidAmount
      return total + remainingAmount
    }, 0)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="p-4 border-b flex items-center justify-between bg-gray-50">
          <h2 className="text-xl font-bold">Payment History</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
          <TabsList className="w-full grid grid-cols-2 p-0 border-b rounded-none">
            <TabsTrigger value="payments" className="rounded-none data-[state=active]:bg-gray-100">
              Payments
            </TabsTrigger>
            <TabsTrigger value="items" className="rounded-none data-[state=active]:bg-gray-100">
              Item Breakdown
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="p-6 space-y-6 mt-0">
            <div className="bg-gray-50 p-4 rounded-md grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-gray-500 text-sm">Total Amount</div>
                <div className="font-bold">{formatCurrency(calculateTabTotal())}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-500 text-sm">Total Paid</div>
                <div className="font-bold text-green-600">{formatCurrency(calculateTotalPaid())}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-500 text-sm">Remaining</div>
                <div className="font-bold text-blue-600">{formatCurrency(calculateRemainingBalance())}</div>
              </div>
            </div>

            {tab.payments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No payment history available for this tab</div>
            ) : (
              <div className="space-y-4">
                {tab.payments.map((payment) => (
                  <div key={payment.id} className="border rounded-md overflow-hidden">
                    <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(payment.method)}
                        <span className="font-medium capitalize">{payment.method} Payment</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          {formatDate(payment.timestamp)}
                        </div>
                        <span className="font-bold">{formatCurrency(payment.amount)}</span>
                      </div>
                    </div>

                    {payment.note && <div className="p-3 border-b bg-blue-50 text-sm">{payment.note}</div>}

                    <div className="p-3">
                      <h4 className="text-sm font-medium mb-2">Allocation Details</h4>
                      <div className="space-y-2">
                        {payment.allocations.map((allocation) => {
                          const item = tab.items.find((i) => i.id === allocation.itemId)
                          return item ? (
                            <div key={`${payment.id}-${allocation.itemId}`} className="flex justify-between text-sm">
                              <span>
                                {item.name} ({item.quantity}x)
                              </span>
                              <span className="font-medium">{formatCurrency(allocation.amount)}</span>
                            </div>
                          ) : null
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="items" className="p-6 space-y-6 mt-0">
            <h3 className="font-medium">Item Payment Status</h3>

            <div className="border rounded-md">
              <div className="bg-gray-50 p-3 border-b grid grid-cols-4">
                <div className="font-medium">Item</div>
                <div className="font-medium text-right">Total</div>
                <div className="font-medium text-right">Paid</div>
                <div className="font-medium text-right">Remaining</div>
              </div>
              <div className="divide-y">
                {tab.items.map((item) => {
                  const itemTotal = item.price * item.quantity
                  const remainingAmount = itemTotal - item.paidAmount

                  return (
                    <div key={item.id} className="p-3 grid grid-cols-4 items-center">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(item.price)} × {item.quantity}
                        </div>
                      </div>
                      <div className="text-right">{formatCurrency(itemTotal)}</div>
                      <div className="text-right text-green-600">{formatCurrency(item.paidAmount)}</div>
                      <div className="text-right text-blue-600">{formatCurrency(remainingAmount)}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Payment Allocations</h3>

              {tab.payments.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No payments have been made yet</div>
              ) : (
                <div className="space-y-4">
                  {tab.items.map((item) => {
                    // Find all payment allocations for this item
                    const allocations = tab.payments.flatMap((payment) =>
                      payment.allocations
                        .filter((allocation) => allocation.itemId === item.id)
                        .map((allocation) => ({
                          ...allocation,
                          paymentId: payment.id,
                          method: payment.method,
                          timestamp: payment.timestamp,
                        })),
                    )

                    if (allocations.length === 0) return null

                    return (
                      <div key={item.id} className="border rounded-md overflow-hidden">
                        <div className="bg-gray-50 p-3 border-b">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-500">
                            {formatCurrency(item.price)} × {item.quantity} ={" "}
                            {formatCurrency(item.price * item.quantity)}
                          </div>
                        </div>
                        <div className="divide-y">
                          {allocations.map((allocation) => (
                            <div
                              key={`${allocation.paymentId}-${item.id}`}
                              className="p-3 flex justify-between items-center"
                            >
                              <div className="flex items-center gap-2">
                                {getPaymentMethodIcon(allocation.method)}
                                <span className="text-sm">{formatDate(allocation.timestamp)}</span>
                              </div>
                              <div className="font-medium">{formatCurrency(allocation.amount)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}

