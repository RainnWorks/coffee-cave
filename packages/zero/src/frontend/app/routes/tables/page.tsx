import {
  Page,
  PageContent,
  PageHeader,
  PageTitle,
} from "../../components/ui/page";
import { Button, buttonVariants } from "../../components/ui/button";
import { ArrowLeft, Plus, ChefHat, Settings } from "lucide-react";
import { cn } from "../../lib/utils";
import { TableCard } from "./components/table-card";
import { parseAsBoolean, useQueryStates } from "nuqs";
import { useTypedZero } from "../../lib/zero";
import { useRestaurantConfig } from "../../contexts/restaurant-config";
import { useReconciledTablesQuery } from "../../lib/table-reconciler";
import { Link } from "wouter";
import { useAuth } from "../../AuthedZeroProvider";

export default function TablesPage() {
  const [{ sct: showClosedTabs }] = useQueryStates({
    sct: parseAsBoolean.withDefault(false).withOptions({
      clearOnDefault: true,
    }),
  });

  const { name } = useRestaurantConfig();

  const z = useTypedZero();
  const [tables, { type }] = useReconciledTablesQuery();
  const { logout } = useAuth();

  // Count total open tabs
  const openTabsCount = tables.reduce(
    (sum, table) => sum + (table.tabs?.filter((tab) => !tab.paid).length ?? 0),
    0
  );

  return (
    <Page className="w-full max-w-6xl">
      <PageHeader className="bg-gray-100 border-b flex flex-row items-center justify-between">
        <Button
          onClick={() => logout()}
          variant="ghost"
          size="sm"
          className={cn("flex items-center gap-1")}
        >
          <ArrowLeft className="h-4 w-4" />
          Logout
        </Button>
        <PageTitle className="text-2xl">
          {name || "Restaurant"} - Tables
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

      {/* {errorMessage ? (
        <div className="p-4 border-b bg-red-50">
          <div className="text-center text-red-500">
            Failed to load tables: {errorMessage}
          </div>
        </div>
      ) : (
      )} */}

      <div className="p-4 border-b bg-gray-50">
        <div className="text-center">
          <span className="font-medium text-gray-700">{tables.length}</span>{" "}
          tables with{" "}
          <span className="font-medium text-gray-700">{openTabsCount}</span>{" "}
          open tabs
        </div>
      </div>

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
