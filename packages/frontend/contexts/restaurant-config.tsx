"use client";

import { createCurrencyFormatter } from "@/lib/currency";
import { createContext, useContext, type ReactNode } from "react";

export interface RestaurantConfig {
  name: string;
  currencyCode: string;
  currencyLocale: string;
  timeZone: string;
  primaryColor: string;
  secondaryColor: string;
}

const RestaurantConfigContext = createContext<RestaurantConfig>(
  null as unknown as RestaurantConfig
);

export const useRestaurantConfig = () => useContext(RestaurantConfigContext);

interface RestaurantConfigProviderProps {
  children: ReactNode;
  config: RestaurantConfig;
}

export function RestaurantConfigProvider({
  children,
  config,
}: RestaurantConfigProviderProps) {
  return (
    <RestaurantConfigContext.Provider value={config}>
      {children}
    </RestaurantConfigContext.Provider>
  );
}

export const useCurrencyFormatter = () => {
  const config = useRestaurantConfig();
  return createCurrencyFormatter(config);
};
