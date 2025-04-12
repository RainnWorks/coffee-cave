import { Suspense } from "react"
import { TableDetailSkeleton } from "@/components/table-detail-skeleton"
import { TableDetailView } from "@/components/table-detail-view"

export default function TableDetailPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Suspense fallback={<TableDetailSkeleton />}>
        <TableDetailView tableId={params.id} />
      </Suspense>
    </main>
  )
}

