"use client";

import { ManifestClient } from "@/lib/manifest/api-client/common";
import { getManifestClient } from "@/lib/manifest/api-client/client";
import { createContext, ReactNode, use, useMemo } from "react";

type ManifestContext = {
  client: ManifestClient;
};

const ManifestContext = createContext<ManifestContext | undefined>(undefined);

export function ManifestProvider({ children }: { children: ReactNode }) {
  const manifestClient = useMemo(() => getManifestClient(), []);
  return (
    <ManifestContext.Provider value={{ client: manifestClient }}>
      {children}
    </ManifestContext.Provider>
  );
}

export function useManifest() {
  const context = use(ManifestContext);

  if (context === undefined) {
    throw new Error("useManifest must be used within a ManifestProvider");
  }

  return context;
}
