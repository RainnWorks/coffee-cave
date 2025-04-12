import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TablesSkeleton() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl shadow-lg">
        <CardHeader className="bg-gray-100 border-b">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-24" />
            <CardTitle className="text-2xl">Tables</CardTitle>
            <Skeleton className="h-8 w-8" />
          </div>
        </CardHeader>

        <div className="p-4 border-b bg-gray-50">
          <Skeleton className="h-6 w-48 mx-auto" />
        </div>

        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
