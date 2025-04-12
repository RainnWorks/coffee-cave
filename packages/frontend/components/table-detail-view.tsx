"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Plus,
  Receipt,
  CreditCard,
  Trash2,
  Coffee,
  Utensils,
  IceCream,
  Clock,
  History,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PaymentHistoryOverlay } from "@/components/payment-history-overlay"
import { useToast } from "@/hooks/use-toast"
import { getTableById, createTab } from "@/lib/data-fetching"
import { calculateRemainingBalance, formatCurrency } from "@/lib/payment-utils"
import { generateTabName } from "@/components/tables-view"
import type { Table, Tab } from "@/components/tables-view"

export function TableDetailView({ tableId }: { tableId: string }) {
  const router = useRouter()
  const { toast } = useToast()

  const [tableData, setTableData] = useState<Table | null>(null)
  const [activeTab, setActiveTab] = useState<Tab | null>(null)
  const [showPaymentHistoryOverlay, setShowPaymentHistoryOverlay] = useState<boolean>(false)
  const [isCreatingTab, setIsCreatingTab] = useState(false)
  const [isRemovingItem, setIsRemovingItem] = useState<string | null>(null)

  useEffect(() => {
    const loadTableData = async () => {
      try {
        const data = await getTableById(tableId)
        setTableData(data)

        // Set the first open tab as active by default
        if (data && data.tabs.length > 0 && !activeTab) {
          const openTab = data.tabs.find((tab) => tab.status === "open")
          setActiveTab(openTab || data.tabs[0])
        }
      } catch (error) {
        console.error("Error loading table data:", error)
        toast({
          title: "Error",
          description: "Failed to load table data",
          variant: "destructive",
        })
      }
    }

    loadTableData()
  }, [tableId, activeTab, toast])

  const handleBack = () => {
    router.push("/tables")
  }

  // Create a new tab
  const handleCreateNewTab = async () => {
    if (!tableData) return

    setIsCreatingTab(true)
    try {
      const newTab = await createTab(tableId)

      // Update local state
      const updatedTable = {
        ...tableData,
        tabs: [...tableData.tabs, newTab],
      }

      setTableData(updatedTable)
      setActiveTab(newTab)

      // Navigate to add items page
      router.push(`/tables/${tableId}/tabs/${newTab.id}/add-items`)
    } catch (error) {
      console.error("Error creating tab:", error)
      toast({
        title: "Error",
        description: "Failed to create new tab",
        variant: "destructive",
      })
    } finally {
      setIsCreatingTab(false)
    }
  }

  // Remove an item from a tab
  const handleRemoveItem = async (tabId: string, itemId: string) => {
    if (!tableData) return

    setIsRemovingItem(itemId)
    try {
      // In a real app, this would be an API call
      // For now, we'll just update the local state

      const updatedTabs = tableData.tabs.map((tab) => {
        if (tab.id === tabId) {
          const updatedItems = tab.items.filter((item) => item.id !== itemId)

          // Recalculate tab totals
          const newAmountDue = updatedItems.reduce((total, item) => total + item.price * item.quantity, 0)

          const newAmountPaid = updatedItems.reduce((total, item) => total + item.paidAmount, 0)

          return {
            ...tab,
            items: updatedItems,
            amountDue: newAmountDue,
            amountPaid: newAmountPaid,
          }
        }
        return tab
      })

      setTableData({
        ...tableData,
        tabs: updatedTabs,
      })

      // Update active tab if it's the one being modified
      if (activeTab && activeTab.id === tabId) {
        const updatedActiveTab = updatedTabs.find((tab) => tab.id === tabId)
        setActiveTab(updatedActiveTab || null)
      }

      toast({
        title: "Item Removed",
        description: "The item has been removed from the tab",
      })
    } catch (error) {
      console.error("Error removing item:", error)
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      })
    } finally {
      setIsRemovingItem(null)
    }
  }

  // Navigate to add items page
  const handleAddItems = (tabId: string) => {
    router.push(`/tables/${tableId}/tabs/${tabId}/add-items`)
  }

  // Navigate to payment page
  const handleNavigateToPayment = () => {
    router.push(`/tables/${tableId}/payment`)
  }

  // Get icon for item based on category
  const getItemIcon = (category: string) => {
    switch (category) {
      case "food":
        return <Utensils className="h-4 w-4" />
      case "drinks":
        return <Coffee className="h-4 w-4" />
      case "dessert":
        return <IceCream className="h-4 w-4" />
      default:
        return <Utensils className="h-4 w-4" />
    }
  }

  // Calculate total remaining balance across all tabs
  const calculateTotalRemainingBalance = (): number => {
    if (!tableData) return 0

    return tableData.tabs.reduce((total, tab) => {
      return total + calculateRemainingBalance(tab)
    }, 0)
  }

  if (!tableData) {
    return (
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="border-b bg-gray-100">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={handleBack} aria-label="Back to tables" className="mr-4">
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

  return (
    <Card className="w-full max-w-4xl shadow-lg">
      <CardHeader className="border-b bg-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={handleBack} aria-label="Back to tables" className="mr-4">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="text-2xl">Table {tableData.number}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {tableData.tabs.filter((tab) => tab.status === "open").length} open tabs
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-1"
              onClick={handleNavigateToPayment}
              disabled={calculateTotalRemainingBalance() <= 0}
            >
              <CreditCard className="h-4 w-4" />
              Process Payment
            </Button>
            <Button className="gap-1" onClick={handleCreateNewTab} disabled={isCreatingTab}>
              {isCreatingTab ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {isCreatingTab ? "Creating..." : "New Tab"}
            </Button>
          </div>
        </div>
      </CardHeader>

      {tableData.tabs.length > 0 && (
        <div className="flex overflow-x-auto border-b bg-gray-50 p-4">
          {tableData.tabs
            .filter((tab) => tab.status === "open")
            .map((tab) => {
              const remainingBalance = calculateRemainingBalance(tab)
              return (
                <Button
                  key={tab.id}
                  variant={activeTab?.id === tab.id ? "default" : "outline"}
                  className="mr-2 whitespace-nowrap"
                  onClick={() => setActiveTab(tab)}
                >
                  {generateTabName(tab)}
                  <span className="ml-1">({formatCurrency(remainingBalance)})</span>
                </Button>
              )
            })}
        </div>
      )}

      <CardContent className="p-6">
        {activeTab ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">{generateTabName(activeTab)}</h3>
                <div className="mt-1 flex items-center text-sm text-gray-500">
                  <Clock className="mr-1 h-3.5 w-3.5" />
                  <span>{activeTab.openTime}</span>
                  <span className="mx-2">•</span>
                  <span>{activeTab.items.length} items</span>
                  {activeTab.payments.length > 0 && (
                    <>
                      <span className="mx-2">•</span>
                      <span>{activeTab.payments.length} payments</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Remaining Balance</div>
                <div className="text-2xl font-bold text-blue-700">
                  {formatCurrency(calculateRemainingBalance(activeTab))}
                </div>
                {activeTab.amountPaid > 0 && (
                  <div className="text-xs text-gray-500">
                    {formatCurrency(activeTab.amountPaid)} paid of {formatCurrency(activeTab.amountDue)}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-md border">
              <div className="flex items-center justify-between border-b bg-gray-50 p-3">
                <h4 className="font-medium">Items</h4>
                <div className="flex gap-2">
                  {activeTab.payments.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1"
                      onClick={() => setShowPaymentHistoryOverlay(true)}
                    >
                      <History className="h-3.5 w-3.5" />
                      Payment History
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1"
                    onClick={() => handleAddItems(activeTab.id)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Items
                  </Button>
                </div>
              </div>

              <div className="divide-y">
                {activeTab.items.length > 0 ? (
                  activeTab.items.map((item) => {
                    const itemTotal = item.price * item.quantity
                    const remainingAmount = itemTotal - item.paidAmount
                    const hasAllergies = item.allergies && item.allergies.length > 0

                    return (
                      <div key={item.id} className="flex flex-col p-3 border-b last:border-b-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="rounded-md bg-gray-100 p-1.5">{getItemIcon(item.category)}</div>
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
                                {hasAllergies && (
                                  <Badge
                                    variant="outline"
                                    className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1"
                                  >
                                    <AlertTriangle className="h-3 w-3" />
                                    Allergies
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatCurrency(item.price)} × {item.quantity}
                              </div>
                              {item.paidAmount > 0 && (
                                <div className="text-xs text-gray-500">
                                  {formatCurrency(item.paidAmount)} paid of {formatCurrency(itemTotal)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="font-medium">{formatCurrency(itemTotal)}</div>
                              {remainingAmount > 0 && (
                                <div className="text-xs text-gray-500">{formatCurrency(remainingAmount)} remaining</div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-500 hover:text-red-500"
                              onClick={() => handleRemoveItem(activeTab.id, item.id)}
                              aria-label={`Remove ${item.name}`}
                              disabled={item.paidAmount > 0 || isRemovingItem === item.id}
                            >
                              {isRemovingItem === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Display notes if available */}
                        {item.notes && (
                          <div className="ml-10 mt-1 text-sm bg-gray-50 p-2 rounded-md text-gray-600 italic">
                            Note: {item.notes}
                          </div>
                        )}

                        {/* Display allergies if available */}
                        {hasAllergies && (
                          <div className="ml-10 mt-1 text-sm bg-red-50 p-2 rounded-md text-red-600 flex items-start gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium">Allergies:</span> {item.allergies?.join(", ")}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className="p-6 text-center text-gray-500">No items in this tab yet</div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button className="flex-1 gap-1" variant="outline" disabled={activeTab.items.length === 0}>
                <Receipt className="h-4 w-4" />
                Print Receipt
              </Button>
              <Button
                className="flex-1 gap-1"
                disabled={activeTab.items.length === 0 || calculateRemainingBalance(activeTab) <= 0}
                onClick={handleNavigateToPayment}
              >
                <CreditCard className="h-4 w-4" />
                Process Payment
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">
            {tableData.tabs.length > 0 ? (
              <p>All tabs are closed or paid. Create a new tab to continue.</p>
            ) : (
              <p>No tabs are currently open for this table.</p>
            )}
            <div className="mt-4">
              <Button onClick={handleCreateNewTab} disabled={isCreatingTab}>
                {isCreatingTab ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {isCreatingTab ? "Creating..." : "Create New Tab"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {showPaymentHistoryOverlay && activeTab && (
        <PaymentHistoryOverlay tab={activeTab} onClose={() => setShowPaymentHistoryOverlay(false)} />
      )}
    </Card>
  )
}
