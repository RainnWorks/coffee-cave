import { Suspense } from "react"
import { AddItemsSkeleton } from "@/components/add-items-skeleton"
import { AddItemsView } from "@/components/add-items-view"

export default function AddItemsPage({ params }: { params: { id: string; tabId: string } }) {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Suspense fallback={<AddItemsSkeleton />}>
        <AddItemsView tableId={params.id} tabId={params.tabId} />
      </Suspense>
    </main>
  )
}

