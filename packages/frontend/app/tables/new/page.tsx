import { Suspense } from "react"
import { NewTableForm } from "@/components/new-table-form"
import { NewTableSkeleton } from "@/components/new-table-skeleton"

export default function NewTablePage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Suspense fallback={<NewTableSkeleton />}>
        <NewTableForm />
      </Suspense>
    </main>
  )
}
