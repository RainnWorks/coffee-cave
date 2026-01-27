"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

export type RouterMode = "tenant" | "platform";

interface RouterModeContextType {
  mode: RouterMode;
  setMode: (mode: RouterMode) => void;
  tenantSlug: string | null;
  setTenantSlug: (id: string | null) => void;
  isDev: boolean;
}

const RouterModeContext = createContext<RouterModeContextType | null>(null);

const STORAGE_KEY = "coffeecave_router_mode";
const TENANT_STORAGE_KEY = "coffeecave_dev_tenant_id";

function detectModeFromHost(): RouterMode {
  if (typeof window === "undefined") return "platform";

  const hostname = window.location.hostname;

  // Production: subdomain = tenant, root = platform
  // e.g., myrestaurant.coffeecave.app = tenant
  // e.g., coffeecave.app = platform
  const parts = hostname.split(".");

  // If we have more than 2 parts (subdomain.domain.tld), it's tenant mode
  // Unless it's www or app subdomain
  if (parts.length > 2) {
    const subdomain = parts[0];
    if (subdomain !== "www" && subdomain !== "app") {
      return "tenant";
    }
  }

  // Localhost special case - check storage or default to platform
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "tenant" || stored === "platform") {
      return stored;
    }
    return "platform";
  }

  return "platform";
}

function extractTenantFromHost(): string | null {
  if (typeof window === "undefined") return null;

  const hostname = window.location.hostname;
  const parts = hostname.split(".");

  if (parts.length > 2) {
    const subdomain = parts[0];
    if (subdomain !== "www" && subdomain !== "app") {
      return subdomain;
    }
  }

  // Dev mode - check storage
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return localStorage.getItem(TENANT_STORAGE_KEY);
  }

  return null;
}

export function RouterModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<RouterMode>(() => detectModeFromHost());
  const [tenantSlug, setTenantSlugState] = useState<string | null>(() =>
    extractTenantFromHost(),
  );

  const isDev =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  const setMode = (newMode: RouterMode) => {
    setModeState(newMode);
    if (isDev) {
      localStorage.setItem(STORAGE_KEY, newMode);
    }
  };

  const setTenantSlug = (slug: string | null) => {
    setTenantSlugState(slug);
    if (isDev) {
      if (slug) {
        localStorage.setItem(TENANT_STORAGE_KEY, slug);
      } else {
        localStorage.removeItem(TENANT_STORAGE_KEY);
      }
    }
  };

  return (
    <RouterModeContext.Provider
      value={{ mode, setMode, tenantSlug, setTenantSlug, isDev }}
    >
      {children}
    </RouterModeContext.Provider>
  );
}

export function useRouterMode() {
  const context = useContext(RouterModeContext);
  if (!context) {
    throw new Error("useRouterMode must be used within RouterModeProvider");
  }
  return context;
}
