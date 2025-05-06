"use client";

import { getCoinsAndNotes } from "@/lib/coins-and-notes";
import {
  createCurrencyFormatter,
  currencyUtils,
} from "@/lib/currency";
import { createContext, useContext, useMemo, type ReactNode } from "react";

export interface RestaurantConfig {
  name: string;
  currencyCode: string;
  currencyLocale: string;
  timeZone: string;
  primaryColor: string;
  secondaryColor: string;
  coinsAndNotes: string;
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

export const useCurrencyUtils = () => {
  const config = useRestaurantConfig();
  return useMemo(
    () =>
      currencyUtils({
        currencyLocale: config.currencyLocale,
        currencyCode: config.currencyCode,
      }),
    [config.currencyLocale, config.currencyCode]
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
    [config.currencyLocale, config.currencyCode, options]
  );
};

export const useCoinsAndNotes = () => {
  const config = useRestaurantConfig();
  return useMemo(
    () => getCoinsAndNotes(config.coinsAndNotes),
    [config.coinsAndNotes]
  );
};
