"use client";

import { getCoinsAndNotes } from "../lib/coins-and-notes";
import { createCurrencyFormatter, currencyUtils } from "../lib/currency";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useTypedZero } from "../lib/zero";
import { useQuery } from "@rocicorp/zero/react";
import { useSuspenseQuery } from "../lib/use-suspense-query";

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
  const z = useTypedZero();
  const [config] = useSuspenseQuery(z.query.restaurant_settings.one());

  return (
    <RestaurantConfigContext.Provider
      value={config ? { ...config, isSetUp: true } : DEFAULT_CONFIG}
    >
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
