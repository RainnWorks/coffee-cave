"use server";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";
import { ComponentProps } from "react";
import { DynamicIcon } from "lucide-react/dynamic";
import { getServerManifestClient } from "@/lib/manifest/api-client/server";
import { createCurrencyFormatter } from "@/lib/currency";
import { redirect } from "next/navigation";
import { ReconciledTable } from "@/lib/manifest/table-reconciler";

interface TableCardProps extends ComponentProps<typeof Card> {
  table: ReconciledTable;
}

export async function TableCard({
  table,
  className,
  ...props
}: TableCardProps) {
  const client = await getServerManifestClient();
  const { result: config, error: configError } =
    await client.restaurantConfig.get();
  if (configError || !config) {
    redirect("/login?error=Failed+to+load+restaurant+config");
  }
  const formatCurrency = createCurrencyFormatter(config);

  const hasOpenTabs = table.tabs?.some((tab) => tab.paid === false) ?? false;

  return (
    <Card
      className={cn(
        `shadow-sm cursor-pointer transition-all hover:shadow-md overflow-hidden`,
        hasOpenTabs ? "border-blue-200" : "border-gray-200",
        className
      )}
      {...props}
    >
      <CardHeader
        className={`py-3 px-4 ${hasOpenTabs ? "bg-blue-50" : "bg-gray-50"}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`text-xl font-bold ${
                hasOpenTabs ? "text-blue-700" : "text-gray-700"
              }`}
            >
              Table {table.name}
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Users className="h-3.5 w-3.5 mr-1" />
              <span>{table.seats}</span>
            </div>
          </div>
          {hasOpenTabs && (
            <div className="font-bold text-blue-700">
              {formatCurrency(table.remainingBalance)}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-3">
        {(table.tabs?.length ?? 0) > 0 &&
        table.tabs?.some((tab) => tab.remainingBalance > 0) ? (
          <div className="space-y-2">
            {table.tabs
              ?.filter((tab) => tab.paid === false)
              .map((tab) => {
                return (
                  <div
                    key={tab.id}
                    className="p-2 rounded-md border border-blue-100 bg-white"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <DynamicIcon name={tab.icon} />
                        <span className="font-medium">{tab.name}</span>
                      </div>
                      <div className="text-sm font-medium">
                        {formatCurrency(tab.remainingBalance)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {tab.tabItems.length} items
                      {tab.paid && (
                        <span className="ml-1">
                          •{" "}
                          {formatCurrency(
                            tab.tabItems
                              .map((item) => item.price)
                              .reduce((a, b) => a + b, 0)
                          )}{" "}
                          paid
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">No open tabs</div>
        )}
      </CardContent>
    </Card>
  );
}
