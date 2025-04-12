"use client"

import type { Table } from "@/components/tables-view"
import { TableCard } from "@/components/table-card"

interface TablesListProps {
  tables: Table[]
  onSelect: (tableId: string) => void
}

export function TablesList({ tables, onSelect }: TablesListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tables.map((table) => (
        <TableCard key={table.id} table={table} onSelect={onSelect} />
      ))}
    </div>
  )
}

