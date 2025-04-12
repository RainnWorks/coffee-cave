import { Suspense } from "react"
import { KitchenViewSkeleton } from "@/components/kitchen-view-skeleton"
import { KitchenView } from "@/components/kitchen-view"

export default function KitchenPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Suspense fallback={<KitchenViewSkeleton />}>
        <KitchenView />
      </Suspense>
    </main>
  )
}

