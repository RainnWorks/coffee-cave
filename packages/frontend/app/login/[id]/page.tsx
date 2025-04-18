import { Page, PageContent, PageHeader, PageTitle } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PinLogin } from "./pin-login";
import { redirect } from "next/navigation";
import { getServerManifestClient } from "@/lib/manifest/api-client/server";

export default async function PosLogin({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  const { id } = await params;
  const client = await getServerManifestClient();
  const { error, result, errorMessage } = await client.staff.getById(id);

  if (error || errorMessage) {
    console.error(error);
    return redirect(
      "/login?error=" +
        encodeURIComponent(
          errorMessage ?? (error as Error).message ?? "Unknown error"
        )
    );
  }

  if (!result) {
    return redirect("/login?error=Staff+not+found");
  }

  return (
    <Page className="w-full lg:max-w-lg">
      <PageHeader className="bg-gray-100 border-b">
        <PageTitle className="text-2xl text-center">Enter PIN</PageTitle>
      </PageHeader>
      <PageContent className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                aria-label="Back to staff selection"
                className="flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            {result ? (
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 mx-auto mb-2">
                  <span className="text-lg font-semibold">
                    {result.firstName[0].toUpperCase() +
                      result.lastName[0].toUpperCase()}
                  </span>
                </div>
                <p className="font-medium">
                  {result.firstName} {result.lastName}
                </p>
              </div>
            ) : null}
            <div className="w-16"></div> {/* Spacer for alignment */}
          </div>
          <PinLogin staffMember={result} />
        </div>
      </PageContent>
    </Page>
  );
}
