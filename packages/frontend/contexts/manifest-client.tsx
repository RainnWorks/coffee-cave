"use client";

import { getClient } from "@/lib/manifest/client";
import Manifest from "@mnfst/sdk";
import { createContext, ReactNode, use } from "react";

type ManifestContext = {
  client: Manifest
}

const ManifestContext = createContext<ManifestContext | undefined>(
  undefined
);

export function ManifestProvider({ children }: { children: ReactNode }) {
  const manifestClient = getClient();
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
