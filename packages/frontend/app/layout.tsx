import "@dmno/nextjs-integration";
import "./globals.css";

import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import {
  RestaurantConfig,
  RestaurantConfigProvider,
} from "@/contexts/restaurant-config";
import { ThemeProvider } from "@/components/theme-provider";
import { ManifestProvider } from "@/contexts/manifest-client";
import { getClient } from "@/lib/manifest/client";
import { Toaster } from "sonner";
import { SearchParamsToaster } from "./search-params-toaster";

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
  const client = getClient();
  const config: RestaurantConfig = await client
    .single("restaurant-settings")
    .get();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <ManifestProvider>
            <RestaurantConfigProvider config={config}>
              {children}
              <Toaster />
              <SearchParamsToaster />
            </RestaurantConfigProvider>
          </ManifestProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
