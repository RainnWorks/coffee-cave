"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, SplitSquareVertical, ListChecks, Users, Loader2, DollarSign } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { getTableById, processPayment } from "@/lib/data-fetching"
import {
  calculateRemainingBalance,
  calculateTotalRemainingBalance,
  formatCurrency,
  autoAllocatePayment,
  calculateSplitAmount,
  createPaymentObject,
} from "@/lib/payment-utils"
import { generateTabName } from "@/components/tables-view"
import { useRestaurantConfig } from "@/contexts/restaurant-config"
import type { Table, MenuItem } from "@/components/tables-view"

export function PaymentView({ tableId }: { tableId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const { config } = useRestaurantConfig()

  const [tableData, setTableData] = useState<Table | null>(null)
  const [paymentType, setPaymentType] = useState<"full" | "split" | "items" | "tab" | "custom">("full")
  const [paymentAmount, setPaymentAmount] = useState<string>("")
  const [paymentNote, setPaymentNote] = useState<string>("")
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null)
  const [splitCount, setSplitCount] = useState<number>(2)
  const [splitPart, setSplitPart] = useState<number>(1)
  const [selectedItems, setSelectedItems] = useState<Record<string, { id: string; quantity: number }>>({})
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const loadTableData = async () => {
      try {
        const data = await getTableById(tableId)
        setTableData(data)

        // Set default selected tab
        if (data && data.tabs.length > 0) {
          const openTab = data.tabs.find((tab) => tab.status === "open")
          if (openTab) {
            setSelectedTabId(openTab.id)
          }
        }

        // Set initial payment amount
        if (data) {
          const totalRemaining = calculateTotalRemainingBalance(data.tabs)
          setPaymentAmount(totalRemaining.toFixed(2))
        }
      } catch (error) {
        console.error("Error loading table data:", error)
        toast({
          title: "Error",
          description: "Failed to load table data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadTableData()
  }, [tableId, toast])

  // Handle payment amount change
  const handlePaymentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (/^\d*\.?\d{0,2}$/.test(value) || value === "") {
      setPaymentAmount(value)
    }
  }

  // Handle payment type change
  const handlePaymentTypeChange = (value: "full" | "split" | "items" | "tab" | "custom") => {
    setPaymentType(value)

    if (!tableData) return

    if (value === "full") {
      // Pay full bill - set amount to total remaining balance
      const totalRemaining = calculateTotalRemainingBalance(tableData.tabs)
      setPaymentAmount(totalRemaining.toFixed(2))
    } else if (value === "split") {
      // Split bill - calculate split amount
      const totalRemaining = calculateTotalRemainingBalance(tableData.tabs)
      const splitAmount = calculateSplitAmount(totalRemaining, splitCount, splitPart)
      setPaymentAmount(splitAmount.toFixed(2))
    } else if (value === "tab" && selectedTabId) {
      // Pay tab - set amount to selected tab's remaining balance
      const selectedTab = tableData.tabs.find((tab) => tab.id === selectedTabId)
      if (selectedTab) {
        setPaymentAmount(calculateRemainingBalance(selectedTab).toFixed(2))
      }
    } else if (value === "items") {
      // Pay per item - reset selected items and amount
      setSelectedItems({})
      setPaymentAmount("0.00")
    } else if (value === "custom") {
      // Custom amount - keep current amount or set to a default
      if (!paymentAmount || Number.parseFloat(paymentAmount) <= 0) {
        setPaymentAmount("0.00")
      }
    }
  }

  // Handle split count change
  const handleSplitCountChange = (newCount: number) => {
    if (newCount >= 2 && newCount <= 20) {
      setSplitCount(newCount)

      // Adjust split part if needed
      if (splitPart > newCount) {
        setSplitPart(newCount)
      }

      // Update payment amount
      if (tableData) {
        const totalRemaining = calculateTotalRemainingBalance(tableData.tabs)
        const splitAmount = calculateSplitAmount(totalRemaining, newCount, splitPart)
        setPaymentAmount(splitAmount.toFixed(2))
      }
    }
  }

  // Handle split part change
  const handleSplitPartChange = (newPart: number) => {
    if (newPart >= 1 && newPart <= splitCount) {
      setSplitPart(newPart)

      // Update payment amount
      if (tableData) {
        const totalRemaining = calculateTotalRemainingBalance(tableData.tabs)
        const splitAmount = calculateSplitAmount(totalRemaining, splitCount, newPart)
        setPaymentAmount(splitAmount.toFixed(2))
      }
    }
  }

  // Handle tab selection
  const handleTabSelection = (tabId: string) => {
    setSelectedTabId(tabId)

    if (paymentType === "tab" && tableData) {
      const selectedTab = tableData.tabs.find((tab) => tab.id === tabId)
      if (selectedTab) {
        setPaymentAmount(calculateRemainingBalance(selectedTab).toFixed(2))

        // Set quantities for items in this tab
        const newItemQuantities: Record<string, number> = {}
        selectedTab.items.forEach((item) => {
          if (item.paymentStatus !== "paid") {
            newItemQuantities[item.id] = item.quantity
          }
        })
        setItemQuantities(newItemQuantities)
      }
    }
  }

  // Handle item selection
  const handleItemSelection = (itemId: string) => {
    const newSelectedItems = { ...selectedItems }

    if (newSelectedItems[itemId]) {
      delete newSelectedItems[itemId]
    } else {
      // Find the item
      let item: MenuItem | undefined
      tableData?.tabs.forEach((tab) => {
        const found = tab.items.find((i) => i.id === itemId)
        if (found) item = found
      })

      if (item) {
        newSelectedItems[itemId] = {
          id: itemId,
          quantity: item.quantity, // Always use full quantity
        }
      }
    }

    setSelectedItems(newSelectedItems)

    // Calculate total for selected items
    if (tableData) {
      let totalSelected = 0

      tableData.tabs.forEach((tab) => {
        tab.items.forEach((item) => {
          if (newSelectedItems[item.id]) {
            const itemTotal = item.price * item.quantity
            const remainingAmount = itemTotal - item.paidAmount
            totalSelected += remainingAmount
          }
        })
      })

      setPaymentAmount(totalSelected.toFixed(2))
    }
  }

  // Handle item quantity change
  const handleItemQuantityChange = (itemId: string, quantity: number) => {
    // Find the item
    let item: MenuItem | undefined
    tableData?.tabs.forEach((tab) => {
      const found = tab.items.find((i) => i.id === itemId)
      if (found) item = found
    })

    if (!item) return

    // Ensure quantity is within valid range
    const maxQuantity = item.quantity
    const validQuantity = Math.max(1, Math.min(maxQuantity, quantity))

    // Update quantity
    setItemQuantities({
      ...itemQuantities,
      [itemId]: validQuantity,
    })

    // If this item is selected, update the selection
    if (selectedItems[itemId]) {
      setSelectedItems({
        ...selectedItems,
        [itemId]: { ...selectedItems[itemId], quantity: validQuantity },
      })

      // Recalculate total
      let totalSelected = 0
      tableData?.tabs.forEach((tab) => {
        tab.items.forEach((item) => {
          if (selectedItems[item.id]) {
            const useQuantity = item.id === itemId ? validQuantity : itemQuantities[item.id] || item.quantity
            const itemPrice = item.price * useQuantity
            const remainingAmount = itemPrice - item.paidAmount
            totalSelected += remainingAmount
          }
        })
      })

      setPaymentAmount(totalSelected.toFixed(2))
    }
  }

  // Handle back button
  const handleBack = () => {
    router.push(`/tables/${tableId}`)
  }

  // Process payment
  const handleProcessPayment = async () => {
    if (!tableData) return

    const paymentVal = Number.parseFloat(paymentAmount)

    if (isNaN(paymentVal) || paymentVal <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      // Create payment object
      const paymentDetails = createPaymentObject(
        paymentVal,
        "card", // Default to card since we removed method selection
        paymentNote || undefined,
      )

      // Prepare allocations with simplified logic
      let allocations: { tabId: string; itemId: string; amount: number; quantity: number }[] = []

      if (paymentType === "items") {
        // For item-based payment, apply payment directly to selected items
        tableData.tabs.forEach((tab) => {
          tab.items.forEach((item) => {
            if (selectedItems[item.id]) {
              const itemTotal = item.price * item.quantity
              const remainingAmount = itemTotal - item.paidAmount

              allocations.push({
                tabId: tab.id,
                itemId: item.id,
                amount: remainingAmount,
                quantity: item.quantity,
              })
            }
          })
        })
      } else {
        // For other payment types, use auto-allocation
        const baseAllocations = autoAllocatePayment(tableData.tabs, paymentVal, {
          paymentType,
          selectedTabId,
          selectedItems: Object.keys(selectedItems).reduce(
            (acc, key) => {
              acc[key] = true
              return acc
            },
            {} as Record<string, boolean>,
          ),
        })

        // Add quantities to allocations
        allocations = baseAllocations.map((alloc) => {
          // Find the item to get its quantity
          let item: MenuItem | undefined
          tableData.tabs.forEach((tab) => {
            if (tab.id === alloc.tabId) {
              const found = tab.items.find((i) => i.id === alloc.itemId)
              if (found) item = found
            }
          })

          return {
            ...alloc,
            quantity: item ? item.quantity : 1, // Always use full quantity
          }
        })
      }

      // Process payment
      await processPayment(tableId, paymentDetails, allocations)

      toast({
        title: "Payment Processed",
        description: `${config?.currencySymbol || "$"}${paymentVal.toFixed(2)} payment has been processed successfully`,
        variant: "success",
      })

      // Navigate back to the table detail page
      router.push(`/tables/${tableId}?payment=success`)
    } catch (error) {
      console.error("Error processing payment:", error)
      toast({
        title: "Payment Failed",
        description: "There was an error processing the payment",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Format currency using restaurant config
  const formatItemPrice = (price: number) => {
    if (config?.currencySymbol) {
      return `${config.currencySymbol}${price.toFixed(2)}`
    }
    return formatCurrency(price)
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="border-b bg-gray-100">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={handleBack} aria-label="Back to table" className="mr-4">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl">Loading...</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <div className="py-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!tableData) {
    return (
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="border-b bg-gray-100">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={handleBack} aria-label="Back to table" className="mr-4">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl">Table Not Found</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500 mb-4">The requested table could not be found.</p>
          <Button onClick={() => router.push("/tables")}>Return to Tables</Button>
        </CardContent>
      </Card>
    )
  }

  const totalRemainingBalance = calculateTotalRemainingBalance(tableData.tabs)

  return (
    <Card className="w-full max-w-4xl shadow-lg">
      <CardHeader className="border-b bg-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={handleBack} aria-label="Back to table" className="mr-4">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="text-2xl">Process Payment</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Table {tableData.number} • {tableData.tabs.length} tabs
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total Remaining</div>
            <div className="text-xl font-bold text-blue-700">{formatItemPrice(totalRemainingBalance)}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Payment Options */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-medium">Payment Type</h3>
              <RadioGroup
                value={paymentType}
                onValueChange={(value) =>
                  handlePaymentTypeChange(value as "full" | "split" | "items" | "tab" | "custom")
                }
                className="space-y-2"
              >
                <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="full" id="payment-full" />
                  <Label htmlFor="payment-full" className="flex items-center gap-2 cursor-pointer">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Pay Full Bill ({formatItemPrice(totalRemainingBalance)})</span>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="tab" id="payment-tab" />
                  <Label htmlFor="payment-tab" className="flex items-center gap-2 cursor-pointer">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <span>Pay Tab</span>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="split" id="payment-split" />
                  <Label htmlFor="payment-split" className="flex items-center gap-2 cursor-pointer">
                    <SplitSquareVertical className="h-4 w-4 text-blue-600" />
                    <span>Split Bill</span>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="items" id="payment-items" />
                  <Label htmlFor="payment-items" className="flex items-center gap-2 cursor-pointer">
                    <ListChecks className="h-4 w-4 text-purple-600" />
                    <span>Pay Selected Items</span>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="custom" id="payment-custom" />
                  <Label htmlFor="payment-custom" className="flex items-center gap-2 cursor-pointer">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span>Custom Amount</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {paymentType === "tab" && (
              <div className="space-y-3">
                <h3 className="font-medium">Select Tab to Pay</h3>
                <div className="space-y-2">
                  {tableData.tabs.map((tab) => {
                    const tabRemaining = calculateRemainingBalance(tab)
                    if (tabRemaining <= 0) return null

                    return (
                      <div
                        key={tab.id}
                        className={`border rounded-md p-3 cursor-pointer hover:bg-gray-50 ${
                          selectedTabId === tab.id ? "border-blue-500 bg-blue-50" : ""
                        }`}
                        onClick={() => handleTabSelection(tab.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{generateTabName(tab)}</div>
                            <div className="text-sm text-gray-500">
                              {tab.items.length} items • Opened {tab.openTime}
                            </div>
                          </div>
                          <div className="font-bold text-blue-700">{formatItemPrice(tabRemaining)}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {paymentType === "split" && (
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
                    <Button variant="outline" size="sm" onClick={() => handleSplitCountChange(splitCount + 1)}>
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
                  <div className="text-xl font-bold">{formatItemPrice(Number.parseFloat(paymentAmount) || 0)}</div>
                  <div className="text-sm text-gray-500">
                    {formatItemPrice(totalRemainingBalance / splitCount)} per part
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label htmlFor="payment-amount">Payment Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {config?.currencySymbol || "$"}
                </span>
                <Input
                  id="payment-amount"
                  type="text"
                  value={paymentAmount}
                  onChange={handlePaymentAmountChange}
                  className="pl-8 text-lg font-bold"
                />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">Note (Optional)</h3>
              <Textarea
                placeholder="Add a note about this payment..."
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>

            {paymentType === "custom" && (
              <div className="space-y-3 border rounded-md p-4 bg-gray-50">
                <h3 className="font-medium">Custom Payment</h3>
                <p className="text-sm text-gray-600">
                  Enter any amount the customer wishes to pay. This payment will be applied to the tab as a whole.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Enter the amount in the payment field below</span>
                </div>
              </div>
            )}

            <Button
              className="w-full h-12 text-lg"
              onClick={handleProcessPayment}
              disabled={
                !paymentAmount ||
                Number.parseFloat(paymentAmount) <= 0 ||
                isProcessing ||
                (paymentType === "tab" && !selectedTabId) ||
                (paymentType === "items" && Object.keys(selectedItems).length === 0)
              }
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                `Process ${formatItemPrice(Number.parseFloat(paymentAmount) || 0)} Payment`
              )}
            </Button>
          </div>

          {/* Right Column - Items */}
          {paymentType === "items" ? (
            <div className="space-y-3">
              <h3 className="font-medium">Select Items to Pay</h3>
              <div className="border rounded-md max-h-[500px] overflow-y-auto">
                {tableData.tabs.map((tab) => {
                  // Skip tabs with no unpaid items
                  const hasUnpaidItems = tab.items.some((item) => item.paymentStatus !== "paid")
                  if (!hasUnpaidItems) return null

                  return (
                    <div key={tab.id} className="border-b last:border-b-0">
                      <div className="bg-gray-50 p-3 font-medium">{generateTabName(tab)}</div>
                      <div className="divide-y">
                        {tab.items.map((item) => {
                          // Skip fully paid items
                          if (item.paymentStatus === "paid") return null

                          const itemTotal = item.price * item.quantity
                          const remaining = itemTotal - item.paidAmount

                          return (
                            <div key={item.id} className="p-3">
                              <div className="flex items-start">
                                <Checkbox
                                  id={`item-${item.id}`}
                                  checked={!!selectedItems[item.id]}
                                  onCheckedChange={() => handleItemSelection(item.id)}
                                  className="mr-3 mt-1"
                                />
                                <div className="flex-1">
                                  <Label htmlFor={`item-${item.id}`} className="cursor-pointer">
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-sm text-gray-500">
                                          {formatItemPrice(item.price)} × {item.quantity}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-medium">{formatItemPrice(remaining)}</div>
                                        {item.paidAmount > 0 && (
                                          <div className="text-xs text-gray-500">
                                            {formatItemPrice(item.paidAmount)} already paid
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </Label>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="font-medium">All Tabs</h3>
              <div className="border rounded-md max-h-[500px] overflow-y-auto">
                {tableData.tabs.map((tab) => {
                  const tabRemaining = calculateRemainingBalance(tab)

                  return (
                    <div key={tab.id} className="border-b last:border-b-0">
                      <div className="bg-gray-50 p-3 flex justify-between items-center">
                        <div className="font-medium">{generateTabName(tab)}</div>
                        <div className="font-bold text-blue-700">{formatItemPrice(tabRemaining)}</div>
                      </div>
                      <div className="divide-y">
                        {tab.items.map((item) => {
                          const itemTotal = item.price * item.quantity
                          const remaining = itemTotal - item.paidAmount

                          return (
                            <div key={item.id} className="p-3 flex justify-between items-center">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{item.name}</span>
                                  {item.paymentStatus !== "unpaid" && (
                                    <Badge
                                      variant={item.paymentStatus === "paid" ? "outline" : "secondary"}
                                      className={
                                        item.paymentStatus === "paid"
                                          ? "bg-green-50 text-green-700 border-green-200"
                                          : "bg-blue-50 text-blue-700 border-blue-200"
                                      }
                                    >
                                      {item.paymentStatus === "paid" ? "Paid" : "Partial"}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {formatItemPrice(item.price)} × {item.quantity}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">{formatItemPrice(remaining)}</div>
                                {item.paidAmount > 0 && (
                                  <div className="text-xs text-gray-500">
                                    {formatItemPrice(item.paidAmount)} already paid
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
