"use client"

import { type Table, generateTabName, calculateRemainingBalance } from "@/components/tables-view"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Coffee, Utensils, IceCream, Users } from "lucide-react"

interface TableCardProps {
  table: Table
  onSelect: (tableId: string) => void
}

export function TableCard({ table, onSelect }: TableCardProps) {
  const hasOpenTabs = table.tabs.some((tab) => tab.status === "open")

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Get total remaining balance for all open tabs
  const getTotalRemainingBalance = () => {
    return table.tabs
      .filter((tab) => tab.status === "open")
      .reduce((total, tab) => total + calculateRemainingBalance(tab), 0)
  }

  // Get icon for tab based on items
  const getTabIcon = (tabName: string) => {
    if (tabName.includes("Food") || tabName.includes("Meal")) {
      return <Utensils className="h-4 w-4" />
    } else if (tabName.includes("Drink")) {
      return <Coffee className="h-4 w-4" />
    } else if (tabName.includes("Dessert")) {
      return <IceCream className="h-4 w-4" />
    } else {
      return null
    }
  }

  return (
    <Card
      className={`shadow-sm cursor-pointer transition-all hover:shadow-md ${
        hasOpenTabs ? "border-blue-200" : "border-gray-200"
      }`}
      onClick={() => onSelect(table.id)}
    >
      <CardHeader className={`py-3 px-4 ${hasOpenTabs ? "bg-blue-50" : "bg-gray-50"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`text-xl font-bold ${hasOpenTabs ? "text-blue-700" : "text-gray-700"}`}>
              Table {table.number}
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Users className="h-3.5 w-3.5 mr-1" />
              <span>{table.seats}</span>
            </div>
          </div>
          {hasOpenTabs && <div className="font-bold text-blue-700">{formatCurrency(getTotalRemainingBalance())}</div>}
        </div>
      </CardHeader>

      <CardContent className="p-3">
        {table.tabs.length > 0 ? (
          <div className="space-y-2">
            {table.tabs
              .filter((tab) => tab.status === "open")
              .map((tab) => {
                const tabName = generateTabName(tab)
                const remainingBalance = calculateRemainingBalance(tab)
                const hasPaidItems = tab.amountPaid > 0

                return (
                  <div key={tab.id} className="p-2 rounded-md border border-blue-100 bg-white">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {getTabIcon(tabName)}
                        <span className="font-medium">{tabName}</span>
                      </div>
                      <div className="text-sm font-medium">{formatCurrency(remainingBalance)}</div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {tab.items.length} items • {tab.openTime}
                      {hasPaidItems && <span className="ml-1">• {formatCurrency(tab.amountPaid)} paid</span>}
                    </div>
                  </div>
                )
              })}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">No open tabs</div>
        )}
      </CardContent>
    </Card>
  )
}

