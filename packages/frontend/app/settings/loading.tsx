import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl shadow-lg">
        <CardHeader className="bg-gray-100 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Skeleton className="h-8 w-8 mr-4" />
              <div>
                <CardTitle className="text-2xl flex items-center">
                  <Skeleton className="h-8 w-32" />
                </CardTitle>
                <Skeleton className="h-4 w-48 mt-1" />
              </div>
            </div>
          </div>
        </CardHeader>

        <div className="p-4 border-b">
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-full max-w-md mb-6" />

          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </Card>
    </main>
  )
}
