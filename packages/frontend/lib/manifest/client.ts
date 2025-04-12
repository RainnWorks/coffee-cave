import Manifest from "@mnfst/sdk";

export type ManifestError = {
  message?: string;
  error: string;
  statusCode?: number;
};


export const isManifestError = (error: unknown): error is ManifestError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "error" in error
  );
};

export const API_URL = process.env.API_BASE_PATH! || "http://localhost:3000";

export const getClient = () => {
  return new Manifest(process.env.API_BASE_PATH || "http://localhost:3000");
};
