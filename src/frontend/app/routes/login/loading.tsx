import { Page, PageContent, PageHeader, PageTitle } from "@/components/ui/page";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <Page className="w-full max-w-md shadow-lg">
      <PageHeader className="bg-gray-100 border-b">
        <PageTitle className="text-2xl text-center">
          Select Staff Member
        </PageTitle>
      </PageHeader>
      <PageContent className="p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400 mb-4" />
          <p className="text-lg text-gray-600 font-medium">Loading...</p>
        </div>
      </PageContent>
    </Page>
  );
}
