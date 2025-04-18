import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function AddItemsSkeleton() {
  return (
    <Card className="w-full max-w-6xl shadow-lg">
      <CardHeader className="border-b bg-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Skeleton className="h-8 w-8 mr-4" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </CardHeader>

      <div className="p-4 border-b">
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="p-4 border-b">
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr]">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-md" />
            ))}
          </div>
        </CardContent>

        <div className="border-l hidden md:block">
          <Skeleton className="h-12 w-full" />
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-md" />
            ))}
          </div>
        </div>
      </div>

      <CardFooter className="p-4 border-t bg-gray-50">
        <div className="flex justify-between items-center w-full">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
      </CardFooter>
    </Card>
  )
}

