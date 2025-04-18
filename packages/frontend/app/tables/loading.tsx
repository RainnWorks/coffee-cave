import { Page, PageContent, PageHeader, PageTitle } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";

export default function TablesSkeleton() {
  return (
      <Page className="w-full max-w-5xl shadow-lg">
        <PageHeader className="bg-gray-100 border-b">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-24" />
            <PageTitle className="text-2xl">Tables</PageTitle>
            <Skeleton className="h-8 w-8" />
          </div>
        </PageHeader>

        <div className="p-4 border-b bg-gray-50">
          <Skeleton className="h-6 w-48 mx-auto" />
        </div>

        <PageContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-md" />
            ))}
          </div>
        </PageContent>
      </Page>
  );
}
