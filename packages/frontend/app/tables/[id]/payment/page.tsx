import { Suspense } from "react"
import { PaymentSkeleton } from "@/components/payment-skeleton"
import { PaymentView } from "@/components/payment-view"

export default function PaymentPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Suspense fallback={<PaymentSkeleton />}>
        <PaymentView tableId={params.id} />
      </Suspense>
    </main>
  )
}

