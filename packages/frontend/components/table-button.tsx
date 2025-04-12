"use client"

import type { Table, Tab } from "@/components/tables-view"
import { Button } from "@/components/ui/button"
import { Users, Clock } from "lucide-react"

interface TableButtonProps {
  table: Table
  onClick: () => void
}

export function TableButton({ table, onClick }: TableButtonProps) {
  const hasOpenTabs = table.tabs.length > 0

  // Calculate total amount due across all tabs
  const totalAmountDue = table.tabs.reduce((sum, tab) => sum + tab.amountDue, 0)

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Get the earliest open time among all tabs
  const getEarliestOpenTime = () => {
    if (table.tabs.length === 0) return null
    return table.tabs[0].openTime
  }

  return (
    <Button
      variant="outline"
      className={`h-auto p-4 flex flex-col items-stretch text-left ${
        hasOpenTabs ? "border-blue-300 bg-blue-50 hover:bg-blue-100" : "border-gray-200 bg-gray-50 hover:bg-gray-100"
      }`}
      onClick={onClick}
      aria-label={`Table ${table.number}, ${table.tabs.length} open tabs, total amount due ${formatCurrency(totalAmountDue)}`}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="text-2xl font-bold">Table {table.number}</div>
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Users className="h-4 w-4" />
          <span>{table.seats}</span>
        </div>
      </div>

      {hasOpenTabs ? (
        <>
          <div className="space-y-2 mb-2">
            {table.tabs.map((tab) => (
              <TabSummary key={tab.id} tab={tab} />
            ))}
          </div>

          <div className="flex justify-between items-center mt-auto pt-2 border-t border-blue-200">
            <div className="flex items-center text-xs text-gray-600">
              <Clock className="h-3 w-3 mr-1" />
              <span>{getEarliestOpenTime()}</span>
            </div>
            <div className="font-bold text-blue-700">{formatCurrency(totalAmountDue)}</div>
          </div>
        </>
      ) : (
        <div className="text-sm text-gray-500 py-4 text-center">No open tabs</div>
      )}
    </Button>
  )
}

interface TabSummaryProps {
  tab: Tab
}

function TabSummary({ tab }: TabSummaryProps) {
  return (
    <div className="flex justify-between text-sm">
      <div className="font-medium truncate" title={tab.name}>
        {tab.name}
        <span className="text-gray-500 ml-1">({tab.items})</span>
      </div>
      <div className="font-medium">
        {new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
        }).format(tab.amountDue)}
      </div>
    </div>
  )
}

