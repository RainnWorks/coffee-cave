"use client"

import type React from "react"

import { useState } from "react"
import type { Tab, Payment, PaymentAllocation } from "@/components/tables-view"
import { Button } from "@/components/ui/button"
import { X, CreditCard, Banknote, Receipt, Clock, AlertCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface PaymentOverlayProps {
  tab: Tab
  onClose: () => void
  onProcessPayment: (paymentDetails: Payment, itemAllocations: PaymentAllocation[]) => void
}

export function PaymentOverlay({ tab, onClose, onProcessPayment }: PaymentOverlayProps) {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash" | "other">("card")
  const [paymentAmount, setPaymentAmount] = useState<string>(calculateRemainingTotal().toFixed(2))
  const [paymentNote, setPaymentNote] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("payment")
  const [itemAllocations, setItemAllocations] = useState<Record<string, number>>({})
  const [autoAllocate, setAutoAllocate] = useState<boolean>(true)
  const [allocationError, setAllocationError] = useState<string>("")

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Calculate total amount for the tab
  function calculateTabTotal(): number {
    return tab.items.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  // Calculate remaining total to be paid
  function calculateRemainingTotal(): number {
    return tab.items.reduce((total, item) => {
      const itemTotal = item.price * item.quantity
      const remainingAmount = itemTotal - item.paidAmount
      return total + remainingAmount
    }, 0)
  }

  // Calculate total paid amount
  function calculateTotalPaid(): number {
    return tab.items.reduce((total, item) => total + item.paidAmount, 0)
  }

  // Handle payment amount change
  const handlePaymentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (/^\d*\.?\d{0,2}$/.test(value) || value === "") {
      setPaymentAmount(value)

      if (autoAllocate) {
        autoAllocatePayment(Number.parseFloat(value) || 0)
      }
    }
  }

  // Auto-allocate payment to unpaid items first
  const autoAllocatePayment = (amount: number) => {
    const newAllocations: Record<string, number> = {}
    let remainingAmount = amount

    // Sort items by payment status: unpaid first, then partial
    const sortedItems = [...tab.items].sort((a, b) => {
      if (a.paymentStatus === "unpaid" && b.paymentStatus !== "unpaid") return -1
      if (a.paymentStatus !== "unpaid" && b.paymentStatus === "unpaid") return 1
      if (a.paymentStatus === "partial" && b.paymentStatus !== "partial") return -1
      if (a.paymentStatus !== "partial" && b.paymentStatus === "partial") return 1
      return 0
    })

    for (const item of sortedItems) {
      if (remainingAmount <= 0) break

      const itemTotal = item.price * item.quantity
      const itemRemaining = itemTotal - item.paidAmount

      if (itemRemaining > 0) {
        const allocatedAmount = Math.min(remainingAmount, itemRemaining)
        newAllocations[item.id] = allocatedAmount
        remainingAmount -= allocatedAmount
      }
    }

    setItemAllocations(newAllocations)
  }

  // Handle allocation change for an item
  const handleAllocationChange = (itemId: string, value: string) => {
    const numValue = value === "" ? 0 : Number.parseFloat(value)

    if (isNaN(numValue)) return

    const newAllocations = { ...itemAllocations }

    if (numValue === 0) {
      delete newAllocations[itemId]
    } else {
      newAllocations[itemId] = numValue
    }

    setItemAllocations(newAllocations)
    setAutoAllocate(false)
    validateAllocations(newAllocations)
  }

  // Validate that allocations match payment amount
  const validateAllocations = (allocations: Record<string, number>) => {
    const totalAllocated = Object.values(allocations).reduce((sum, val) => sum + val, 0)
    const paymentVal = Number.parseFloat(paymentAmount) || 0

    if (Math.abs(totalAllocated - paymentVal) > 0.01) {
      setAllocationError(
        `Allocation total (${formatCurrency(totalAllocated)}) doesn't match payment amount (${formatCurrency(paymentVal)})`,
      )
      return false
    } else {
      setAllocationError("")
      return true
    }
  }

  // Calculate total allocated amount
  const calculateTotalAllocated = () => {
    return Object.values(itemAllocations).reduce((sum, val) => sum + val, 0)
  }

  // Handle payment submission
  const handleSubmitPayment = () => {
    const paymentVal = Number.parseFloat(paymentAmount)

    if (isNaN(paymentVal) || paymentVal <= 0) {
      return
    }

    if (!validateAllocations(itemAllocations)) {
      return
    }

    const paymentDetails: Payment = {
      id: `p${Date.now()}`,
      amount: paymentVal,
      method: paymentMethod,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      note: paymentNote || undefined,
      allocations: [],
    }

    const allocations: PaymentAllocation[] = Object.entries(itemAllocations).map(([itemId, amount]) => ({
      itemId,
      amount,
    }))

    onProcessPayment(paymentDetails, allocations)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
        <div className="p-4 border-b flex items-center justify-between bg-gray-50">
          <h2 className="text-xl font-bold">Payment Management</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 p-0 border-b rounded-none">
            <TabsTrigger value="payment" className="rounded-none data-[state=active]:bg-gray-100">
              New Payment
            </TabsTrigger>
            <TabsTrigger value="allocations" className="rounded-none data-[state=active]:bg-gray-100">
              Allocations
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-none data-[state=active]:bg-gray-100">
              Payment History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payment" className="p-6 space-y-6 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Tab Summary</h3>
                  <div className="bg-gray-50 p-4 rounded-md space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-medium">{formatCurrency(calculateTabTotal())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Already Paid:</span>
                      <span className="font-medium">{formatCurrency(calculateTotalPaid())}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-600">Remaining Balance:</span>
                      <span className="font-bold text-blue-700">{formatCurrency(calculateRemainingTotal())}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Payment Method</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={paymentMethod === "card" ? "default" : "outline"}
                      className="justify-start gap-2"
                      onClick={() => setPaymentMethod("card")}
                    >
                      <CreditCard className="h-4 w-4" />
                      Card
                    </Button>
                    <Button
                      variant={paymentMethod === "cash" ? "default" : "outline"}
                      className="justify-start gap-2"
                      onClick={() => setPaymentMethod("cash")}
                    >
                      <Banknote className="h-4 w-4" />
                      Cash
                    </Button>
                    <Button
                      variant={paymentMethod === "other" ? "default" : "outline"}
                      className="justify-start gap-2"
                      onClick={() => setPaymentMethod("other")}
                    >
                      <Receipt className="h-4 w-4" />
                      Other
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="payment-amount" className="font-medium">
                    Payment Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="payment-amount"
                      type="text"
                      value={paymentAmount}
                      onChange={handlePaymentAmountChange}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="payment-note" className="font-medium">
                    Note (Optional)
                  </label>
                  <Textarea
                    id="payment-note"
                    placeholder="Add a note about this payment..."
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    className="resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="auto-allocate"
                      checked={autoAllocate}
                      onChange={(e) => {
                        setAutoAllocate(e.target.checked)
                        if (e.target.checked) {
                          autoAllocatePayment(Number.parseFloat(paymentAmount) || 0)
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="auto-allocate" className="text-sm">
                      Auto-allocate payment
                    </label>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("allocations")}>
                    View Allocations
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button
                className="flex-1 gap-1"
                onClick={handleSubmitPayment}
                disabled={!paymentAmount || Number.parseFloat(paymentAmount) <= 0 || !!allocationError}
              >
                <Receipt className="h-4 w-4" />
                Process Payment
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="allocations" className="p-6 space-y-6 mt-0">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Payment Allocation</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Total:</span>
                <span className="font-bold">{formatCurrency(calculateTotalAllocated())}</span>
              </div>
            </div>

            {allocationError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{allocationError}</span>
              </div>
            )}

            <div className="border rounded-md">
              <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
                <span className="font-medium">Item</span>
                <span className="font-medium">Allocation</span>
              </div>
              <div className="divide-y">
                {tab.items.map((item) => {
                  const itemTotal = item.price * item.quantity
                  const alreadyPaid = item.paidAmount
                  const remaining = itemTotal - alreadyPaid
                  const allocated = itemAllocations[item.id] || 0

                  return (
                    <div key={item.id} className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-500">
                            {formatCurrency(item.price)} × {item.quantity}
                          </div>
                        </div>
                        <Badge
                          variant={
                            item.paymentStatus === "paid"
                              ? "outline"
                              : item.paymentStatus === "partial"
                                ? "secondary"
                                : "default"
                          }
                          className={
                            item.paymentStatus === "paid"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : item.paymentStatus === "partial"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : ""
                          }
                        >
                          {item.paymentStatus === "paid"
                            ? "Paid"
                            : item.paymentStatus === "partial"
                              ? "Partial"
                              : "Unpaid"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="bg-gray-50 p-2 rounded">
                          <div className="text-gray-500">Total</div>
                          <div className="font-medium">{formatCurrency(itemTotal)}</div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <div className="text-gray-500">Paid</div>
                          <div className="font-medium">{formatCurrency(alreadyPaid)}</div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <div className="text-gray-500">Remaining</div>
                          <div className="font-medium">{formatCurrency(remaining)}</div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <div className="text-sm font-medium">Allocate:</div>
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <Input
                            type="text"
                            value={itemAllocations[item.id]?.toString() || ""}
                            onChange={(e) => handleAllocationChange(item.id, e.target.value)}
                            className="pl-8"
                            placeholder="0.00"
                            disabled={item.paymentStatus === "paid" || remaining <= 0}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setActiveTab("payment")}>
                Back to Payment
              </Button>
              <Button
                className="ml-auto"
                onClick={handleSubmitPayment}
                disabled={!paymentAmount || Number.parseFloat(paymentAmount) <= 0 || !!allocationError}
              >
                Process Payment
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="history" className="p-6 space-y-6 mt-0">
            <h3 className="font-medium">Payment History</h3>

            {tab.payments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No payment history available for this tab</div>
            ) : (
              <div className="space-y-4">
                {tab.payments.map((payment) => (
                  <div key={payment.id} className="border rounded-md overflow-hidden">
                    <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {payment.method === "card" ? (
                          <CreditCard className="h-4 w-4 text-blue-600" />
                        ) : payment.method === "cash" ? (
                          <Banknote className="h-4 w-4 text-green-600" />
                        ) : (
                          <Receipt className="h-4 w-4 text-purple-600" />
                        )}
                        <span className="font-medium capitalize">{payment.method} Payment</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          {payment.timestamp}
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
        </Tabs>
      </div>
    </div>
  )
}

