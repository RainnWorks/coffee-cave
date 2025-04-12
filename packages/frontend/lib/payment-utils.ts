import type { Tab, MenuItem, Payment } from "@/components/tables-view"

// Calculate remaining balance for a tab
export function calculateRemainingBalance(tab: Tab): number {
  return tab.items.reduce((total, item) => {
    const itemTotal = item.price * item.quantity
    const remainingAmount = itemTotal - item.paidAmount
    return total + remainingAmount
  }, 0)
}

// Calculate total remaining balance across all tabs
export function calculateTotalRemainingBalance(tabs: Tab[]): number {
  return tabs.reduce((total, tab) => {
    return total + calculateRemainingBalance(tab)
  }, 0)
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount)
}

// Auto-allocate payment to items based on payment type
export function autoAllocatePayment(
  tabs: Tab[],
  amount: number,
  options: {
    paymentType: "full" | "split" | "items" | "tab"
    selectedTabId?: string
    selectedItems?: Record<string, boolean>
  },
): Array<{ tabId: string; itemId: string; amount: number }> {
  const { paymentType, selectedTabId, selectedItems } = options
  const allocations: Array<{ tabId: string; itemId: string; amount: number }> = []
  let remainingAmount = amount

  if (paymentType === "items" && selectedItems) {
    // Allocate to selected items
    tabs.forEach((tab) => {
      tab.items.forEach((item) => {
        if (selectedItems[item.id] && remainingAmount > 0) {
          const itemTotal = item.price * item.quantity
          const itemRemaining = itemTotal - item.paidAmount

          if (itemRemaining > 0) {
            const allocatedAmount = Math.min(remainingAmount, itemRemaining)
            allocations.push({
              tabId: tab.id,
              itemId: item.id,
              amount: allocatedAmount,
            })
            remainingAmount -= allocatedAmount
          }
        }
      })
    })
  } else if (paymentType === "tab" && selectedTabId) {
    // Allocate to all items in selected tab
    const selectedTab = tabs.find((tab) => tab.id === selectedTabId)
    if (selectedTab) {
      // Sort items by payment status: unpaid first, then partial
      const sortedItems = [...selectedTab.items].sort((a, b) => {
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
          allocations.push({
            tabId: selectedTab.id,
            itemId: item.id,
            amount: allocatedAmount,
          })
          remainingAmount -= allocatedAmount
        }
      }
    }
  } else {
    // Allocate to all tabs, prioritizing unpaid items
    const allItems: Array<{ item: MenuItem; tabId: string }> = []

    tabs.forEach((tab) => {
      tab.items.forEach((item) => {
        if (item.paymentStatus !== "paid") {
          allItems.push({ item, tabId: tab.id })
        }
      })
    })

    // Sort items by payment status: unpaid first, then partial
    allItems.sort((a, b) => {
      if (a.item.paymentStatus === "unpaid" && b.item.paymentStatus !== "unpaid") return -1
      if (a.item.paymentStatus !== "unpaid" && b.item.paymentStatus === "unpaid") return 1
      if (a.item.paymentStatus === "partial" && b.item.paymentStatus !== "partial") return -1
      if (a.item.paymentStatus !== "partial" && b.item.paymentStatus === "partial") return 1
      return 0
    })

    for (const { item, tabId } of allItems) {
      if (remainingAmount <= 0) break

      const itemTotal = item.price * item.quantity
      const itemRemaining = itemTotal - item.paidAmount

      if (itemRemaining > 0) {
        const allocatedAmount = Math.min(remainingAmount, itemRemaining)
        allocations.push({
          tabId,
          itemId: item.id,
          amount: allocatedAmount,
        })
        remainingAmount -= allocatedAmount
      }
    }
  }

  return allocations
}

// Calculate split amount based on total, number of parts, and parts to pay
export function calculateSplitAmount(total: number, splitCount: number, splitPart: number): number {
  return (total / splitCount) * splitPart
}

// Create a payment object
export function createPaymentObject(
  amount: number,
  method: "card" | "cash" | "other",
  note?: string,
): Omit<Payment, "id" | "timestamp"> {
  return {
    amount,
    method,
    note,
    allocations: [],
  }
}

