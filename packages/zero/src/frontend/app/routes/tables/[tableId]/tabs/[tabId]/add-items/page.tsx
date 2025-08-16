"server only";

import { getServerManifestClient } from "@/lib/manifest/api-client/server";
import { PageError } from "@/app/tables/components/page-error";
import AddItemsPageView from "./components/page";
import { connection } from "next/server";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
const makeSerializable = <T extends unknown>(value: T) =>
  JSON.parse(JSON.stringify(value));

export default async function AddItemsPage({
  params,
}: {
  params: Promise<{
    tableId: number;
    tabId: number;
  }>;
}) {
  await connection();
  const { tabId, tableId } = await params;
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

  const { errorMessage: tabErrorMessage, result: tab } =
    await client.tabs.getById(tabId);
  if (tabErrorMessage || !tab) {
    return (
      <PageError
        backTo={`/tables/${tableId}`}
        errorMessage={"Tab Error: " + (tabErrorMessage ?? "Tab not found")}
      />
    );
  }

  const { result: categories, errorMessage: categoriesErrorMessage } =
    await client.categories.list();

  if (categoriesErrorMessage || !categories) {
    return (
      <PageError
        backTo={`/tables/${tableId}`}
        errorMessage={
          "Categories Error: " +
          (categoriesErrorMessage ?? "Categories not found")
        }
      />
    );
  }

  const { result: allergens, errorMessage: allergensErrorMessage } =
    await client.allergens.list();
  if (allergensErrorMessage || !allergens) {
    return (
      <PageError
        backTo={`/tables/${tableId}`}
        errorMessage={
          "Allergens Error: " + (allergensErrorMessage ?? "Allergens not found")
        }
      />
    );
  }

  return (
    <AddItemsPageView
      allergens={makeSerializable(allergens.data)}
      categories={makeSerializable(categories.data)}
      table={makeSerializable(table)}
      tabId={makeSerializable(tabId)}
    />
  );
}
