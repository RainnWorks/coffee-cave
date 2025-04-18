import { Page, PageContent, PageHeader, PageTitle } from "@/components/ui/page";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft, Plus, ChefHat, Settings } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TableCard } from "@/app/tables/components/table-card";
import { getServerManifestClient } from "@/lib/manifest/api-client/server";

export const dynamic = "force-dynamic";

export default async function TablesView() {
  const client = await getServerManifestClient();
  const { errorMessage: configErrorMessage, result: config } =
    await client.restaurantConfig.get();

  if (configErrorMessage) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="p-4 border-b bg-red-50">
          <div className="text-center text-red-500">
            Failed to load restaurant config: {configErrorMessage}
          </div>
        </div>
      </main>
    );
  }

  const { errorMessage, result } = await client.tables.list({
    order: {
      order: "ASC",
      orderBy: "createdAt",
    },
  });

  const tables = result?.data ?? [];

  // Count total open tabs
  const openTabsCount = tables.reduce(
    (sum, table) => sum + (table.tabs?.filter((tab) => !tab.paid).length ?? 0),
    0
  );

  return (
    <Page className="w-full max-w-6xl">
      <PageHeader className="bg-gray-100 border-b flex flex-row items-center justify-between">
        <Link
          href="/api/logout"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "flex items-center gap-1"
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Logout
        </Link>
        <PageTitle className="text-2xl">
          {config?.name || "Restaurant"} - Tables
        </PageTitle>
        <div className="flex gap-2">
          <Link
            href="/settings"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "flex items-center gap-1"
            )}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
          <Link
            href="/kitchen"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "flex items-center gap-1"
            )}
          >
            <ChefHat className="h-4 w-4" />
            <span>Kitchen</span>
          </Link>
          <Link
            href="/tables/new"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "flex items-center gap-1"
            )}
          >
            <Plus className="h-4 w-4" />
            <span>New Table</span>
          </Link>
        </div>
      </PageHeader>

      {errorMessage ? (
        <div className="p-4 border-b bg-red-50">
          <div className="text-center text-red-500">
            Failed to load tables: {errorMessage}
          </div>
        </div>
      ) : (
        <div className="p-4 border-b bg-gray-50">
          <div className="text-center">
            <span className="font-medium text-gray-700">{tables.length}</span>{" "}
            tables with{" "}
            <span className="font-medium text-gray-700">{openTabsCount}</span>{" "}
            open tabs
          </div>
        </div>
      )}

      <PageContent className="p-4 md:p-6">
        {tables.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tables.map((table) => (
              <Link key={"table-" + table.id} href={`/tables/${table.id}`}>
                <TableCard table={table} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-4">No tables available</p>
            <Link
              href="/tables/new"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "flex items-center gap-1"
              )}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create First Table
            </Link>
          </div>
        )}
      </PageContent>
    </Page>
  );
}
