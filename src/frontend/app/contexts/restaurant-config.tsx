"use client";

import { useQuery } from "@rocicorp/zero/react";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { queries } from "@/queries";
import { getCoinsAndNotes } from "../lib/coins-and-notes";
import { createCurrencyFormatter, currencyUtils } from "../lib/currency";
import { useZeroAuth } from "../zero";
import { useRouterMode } from "./router-mode";

export interface RestaurantConfig {
  isSetUp: boolean;
  name: string;
  currencyCode: string;
  currencyLocale: string;
  timeZone: string;
  primaryColor: string;
  secondaryColor: string;
  coinsAndNotes: string;
}

const DEFAULT_CONFIG: RestaurantConfig = {
  isSetUp: false,
  coinsAndNotes: "1,2,5,10,20,50,100,200,500,1000,5000,10000,50000",
  name: "New Restaurant",
  currencyCode: "EUR",
  currencyLocale: "en-GB",
  timeZone: "Europe/Paris",
  primaryColor: "#FF0000",
  secondaryColor: "#00FF00",
};

const RestaurantConfigContext = createContext<RestaurantConfig>(DEFAULT_CONFIG);

export const useRestaurantConfig = () => useContext(RestaurantConfigContext);

interface RestaurantConfigProviderProps {
  children: ReactNode;
}

export function RestaurantConfigProvider({
  children,
}: RestaurantConfigProviderProps) {
  const { isReady, tenantId } = useZeroAuth();
  const { isDev, setMode } = useRouterMode();
  const [hasCheckedTenant, setHasCheckedTenant] = useState(false);

  // Query settings when we have tenant context (either logged in or anonymous token)
  const hasTenantContext = isReady && tenantId !== null;
  const [config, queryStatus] = useQuery(
    isReady ? queries.config.settings() : null,
  );
  const isComplete = queryStatus.type === "complete";

  // Handle tenant not found: redirect appropriately
  useEffect(() => {
    // Wait for query to complete and tenant context to be available
    if (!hasTenantContext || !isComplete) return;

    // If logged in and query complete but no config, tenant doesn't exist
    if (config === null && !hasCheckedTenant) {
      setHasCheckedTenant(true);
      console.warn("[RestaurantConfig] Tenant not found");

      if (isDev) {
        // Dev mode: switch back to platform mode locally
        setMode("platform");
        window.location.href = "/";
      } else {
        // Production: redirect to root domain (strip subdomain)
        // e.g., invalid-tenant.coffeecave.app → coffeecave.app
        const hostname = window.location.hostname;
        const parts = hostname.split(".");
        if (parts.length > 2) {
          // Remove subdomain and redirect to root domain
          const rootDomain = parts.slice(1).join(".");
          window.location.href = `${window.location.protocol}//${rootDomain}`;
        } else {
          // Already on root domain somehow, just go to /
          window.location.href = "/";
        }
      }
    }
  }, [hasTenantContext, isComplete, config, hasCheckedTenant, isDev, setMode]);

  const memoizedConfig = useMemo(
    () => (config ? { ...config, isSetUp: true } : DEFAULT_CONFIG),
    [config],
  );

  console.log({config, isComplete, tenantId, isReady, queryStatus});

  if (isReady && (!tenantId || (isComplete && config === null))) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="mt-2 text-sm text-gray-500">Restaurant not found</p>
        </div>
      </div>
    );
  }

  // Show loading state while checking tenant validity
  if (hasTenantContext && !isComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Loading restaurant...</p>
        </div>
      </div>
    );
  }

  return (
    <RestaurantConfigContext.Provider value={memoizedConfig}>
      {children}
    </RestaurantConfigContext.Provider>
  );
}

export const useCurrencyUtils = () => {
  const config = useRestaurantConfig();
  return useMemo(
    () =>
      currencyUtils({
        currencyLocale: config.currencyLocale,
        currencyCode: config.currencyCode,
      }),
    [config.currencyLocale, config.currencyCode],
  );
};

export const useCurrencyFormatter = (options?: Intl.NumberFormatOptions) => {
  const config = useRestaurantConfig();
  return useMemo(
    () =>
      createCurrencyFormatter({
        currencyLocale: config.currencyLocale,
        currencyCode: config.currencyCode,
        options,
      }),
    [config.currencyLocale, config.currencyCode, options],
  );
};

export const useCoinsAndNotes = () => {
  const config = useRestaurantConfig();
  return useMemo(
    () => getCoinsAndNotes(config.coinsAndNotes),
    [config.coinsAndNotes],
  );
};
