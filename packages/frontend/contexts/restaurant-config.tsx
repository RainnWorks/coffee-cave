"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface RestaurantConfig {
  name: string;
  currencyCode: string;
  timeZone: string;
  primaryColor: string;
  secondaryColor: string;
}

interface RestaurantConfigContextType {
  config: RestaurantConfig | null;
  error: string | null;
}

const RestaurantConfigContext = createContext<RestaurantConfigContextType>({
  config: null,
  error: null,
});

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
    <RestaurantConfigContext.Provider value={{ config, error: null }}>
      {children}
    </RestaurantConfigContext.Provider>
  );
}
