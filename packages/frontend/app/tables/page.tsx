import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { ArrowLeft, Plus, Loader2, ChefHat, Settings } from "lucide-react";
import { TablesList } from "@/components/tables-list";
import { useRestaurantConfig } from "@/contexts/restaurant-config";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Update the MenuItem type to include notes and allergies
export type MenuItem = {
  id: string;
  name: string;
  category:
    | "food"
    | "drinks"
    | "dessert"
    | "appetizers"
    | "salads"
    | "sandwiches"
    | "entrees"
    | "sides"
    | "specials"
    | "kids"
    | string;
  price: number;
  quantity: number;
  paidAmount: number;
  paymentStatus: "unpaid" | "partial" | "paid";
  notes?: string;
  allergies?: string[];
  status?: "done" | "not_done"; // Simplified status for kitchen view
  timeOrdered?: string;
};

export type Payment = {
  id: string;
  amount: number;
  method: "cash" | "card" | "other";
  timestamp: string;
  note?: string;
  allocations: PaymentAllocation[];
};

export type PaymentAllocation = {
  itemId: string;
  amount: number;
  quantity?: number; // Added for partial quantity payments
};

export type Tab = {
  id: string;
  name: string;
  items: MenuItem[];
  amountDue: number;
  amountPaid: number;
  status: "open" | "paid" | "closed";
  openTime: string;
  payments: Payment[];
};

export type Table = {
  id: string;
  number: number;
  tabs: Tab[];
  seats: number;
  guestName?: string;
  allergies?: string;
  createdAt?: string;
};

// Generate a descriptive name for a tab based on its items
export const generateTabName = (tab: Tab): string => {
  const categories = [...new Set(tab.items.map((item) => item.category))];

  if (categories.includes("food") && categories.includes("drinks")) {
    return "Meal & Drinks";
  } else if (categories.includes("food") && categories.includes("dessert")) {
    return "Meal & Dessert";
  } else if (categories.includes("drinks") && categories.includes("dessert")) {
    return "Drinks & Dessert";
  } else if (categories.includes("food")) {
    return "Food";
  } else if (categories.includes("drinks")) {
    return "Drinks";
  } else if (categories.includes("dessert")) {
    return "Dessert";
  } else if (tab.name && tab.name !== "New Tab") {
    return tab.name;
  } else {
    return "Order";
  }
};

// Calculate remaining balance for a tab
export const calculateRemainingBalance = (tab: Tab): number => {
  return tab.items.reduce((total, item) => {
    const itemTotal = item.price * item.quantity;
    const remainingAmount = itemTotal - item.paidAmount;
    return total + remainingAmount;
  }, 0);
};

// Calculate total amount for a tab
export const calculateTabTotal = (tab: Tab): number => {
  return tab.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
};

export default async function TablesView() {
  const { config } = useRestaurantConfig();

  // Count tables with open tabs
  const tablesWithOpenTabs = tables.filter((table) =>
    table.tabs.some((tab) => tab.status === "open")
  ).length;

  // Count total open tabs
  const openTabsCount = tables.reduce(
    (sum, table) =>
      sum + table.tabs.filter((tab) => tab.status === "open").length,
    0 
  );

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl shadow-lg">
        <CardHeader className="bg-gray-100 border-b flex flex-row items-center justify-between">
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
          <CardTitle className="text-2xl">
            {config?.name || "Restaurant"} - Tables
          </CardTitle>
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
              href="/create-table"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "flex items-center gap-1"
              )}
            >
              <Plus className="h-4 w-4" />
              <span>New Table</span>
            </Link>
          </div>
        </CardHeader>

        <div className="p-4 border-b bg-gray-50">
          <div className="text-center">
            <span className="font-medium text-gray-700">
              {tablesWithOpenTabs}
            </span>{" "}
            tables with{" "}
            <span className="font-medium text-gray-700">{openTabsCount}</span>{" "}
            open tabs
          </div>
        </div>

        <CardContent className="p-4 md:p-6">
          {tables.length > 0 ? (
            <TablesList tables={tables} onSelect={handleTableSelect} />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No tables available</p>
              <Button onClick={handleCreateTable}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Table
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
