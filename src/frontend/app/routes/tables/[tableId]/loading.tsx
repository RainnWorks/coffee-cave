import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TableDetailSkeleton() {
  return (
    <Card className="w-full lg:max-w-4xl shadow-lg">
      <CardHeader className="border-b bg-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Skeleton className="h-8 w-8 mr-4" />
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </CardHeader>

      <div className="flex overflow-x-auto border-b bg-gray-50 p-4">
        <Skeleton className="h-10 w-32 mr-2" />
        <Skeleton className="h-10 w-32 mr-2" />
        <Skeleton className="h-10 w-32" />
      </div>

      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>

          <div className="rounded-md border">
            <div className="flex items-center justify-between border-b bg-gray-50 p-3">
              <Skeleton className="h-6 w-16" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>

            <div className="divide-y">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <div>
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
