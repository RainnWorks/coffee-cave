import { Card, CardContent, CardHeader } from "@/frontend/app/ui/card";
import { Skeleton } from "@/frontend/app/ui/skeleton";

export default function NewTableSkeleton() {
  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="border-b bg-gray-100">
        <div className="flex items-center">
          <Skeleton className="h-8 w-8 mr-4" />
          <Skeleton className="h-8 w-32" />
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-full mx-2" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-24 w-full" />
        </div>

        <Skeleton className="h-10 w-full mt-4" />
      </CardContent>
    </Card>
  );
}
