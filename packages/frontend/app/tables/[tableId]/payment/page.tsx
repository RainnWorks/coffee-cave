import type React from "react";
import { PaymentView } from "./components/view";
import { PageError } from "../../components/page-error";
import { getServerManifestClient } from "@/lib/manifest/api-client/server";
import { connection } from 'next/server'

export const dynamic = "force-dynamic";

export default async function PaymentPage({
  params,
}: {
  params: Promise<{
    tableId: number;
  }>;
}) {
  await connection();
  const { tableId } = await params;
  const client = await getServerManifestClient();

  const { errorMessage: tableErrorMessage, result: table } =
    await client.tables.getById(tableId);

  if (tableErrorMessage || !table) {
    return (
      <PageError
        backTo={`/tables/${tableId}`}
        errorMessage={
          "Table Error: " + (tableErrorMessage ?? "Table not found")
        }
      />
    );
  }
  return <PaymentView table={table} />;
}
