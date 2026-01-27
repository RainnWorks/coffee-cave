import { Card, CardContent, CardHeader } from "@/frontend/app/ui/card";
import { Skeleton } from "@/frontend/app/ui/skeleton";

export default function PaymentSkeleton() {
  return (
    <Card className="w-full lg:max-w-4xl shadow-lg">
      <CardHeader className="border-b bg-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Skeleton className="h-8 w-8 mr-4" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Skeleton className="h-6 w-32 mb-2" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>

            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-14 w-full" />

            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-24 w-full" />

            <Skeleton className="h-12 w-full" />
          </div>

          <div className="space-y-6">
            <Skeleton className="h-6 w-32 mb-2" />
            <div className="border rounded-md">
              <Skeleton className="h-12 w-full" />
              <div className="divide-y">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-3">
                    <div className="flex justify-between mb-2">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
