import "@dmno/nextjs-integration";
import "./globals.css";

import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { RestaurantConfigProvider } from "@/contexts/restaurant-config";
import { ThemeProvider } from "@/components/theme-provider";
import { ManifestProvider } from "@/contexts/manifest-client";
import { Toaster } from "sonner";
import { SearchParamsToaster } from "./search-params-toaster";
import { getServerManifestClient } from "@/lib/manifest/api-client/server";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Restaurant POS System",
  description: "A modern point of sale system for restaurants",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const client = await getServerManifestClient();
  const {
    errorMessage: configErrorMessage,
    result: config,
    error,
  } = await client.restaurantConfig.get();

  if (error) console.error(error);

  const className = cn(inter.className);

  if (!config) {
    return (
      <html className={className} lang="en" suppressHydrationWarning>
        <body className={className}>
          <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="p-4 border-b bg-red-50">
              <div className="text-center text-red-500">
                Failed to load restaurant config: {configErrorMessage}
              </div>
            </div>
          </main>
        </body>
      </html>
    );
  }
  return (
    <html className={className} lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <ManifestProvider>
            <RestaurantConfigProvider config={config}>
              <NuqsAdapter>
                <main className="min-h-screen bg-gray-5 lg:flex items-center justify-center lg:p-4">
                  {children}
                </main>
                <Toaster />
                <SearchParamsToaster />
              </NuqsAdapter>
            </RestaurantConfigProvider>
          </ManifestProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
