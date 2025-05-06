"use server";

import { headers } from "next/headers";
import {
  API_URL,
  APIClient,
  createManifestClient,
  ManifestClient,
} from "./common";

let client: Promise<ManifestClient> | null = null;

/**
 * Creates a fetch function that automatically includes the server headers
 * @returns A ManifestClient instance with server headers automatically included
 */
export const getServerManifestClient = async (): Promise<ManifestClient> => {
  if (client) return await client;

  client = new Promise<ManifestClient>(async (resolve) => {
    const headersList = await headers();

    // Create the API client function that includes server headers
    const apiClient: APIClient = async (
      path: string,
      options: RequestInit = {}
    ) => {
      // Create a new headers object from the existing options.headers (if any)
      const fetchHeaders = new Headers(options.headers);

      // Add all headers from the server request
      headersList.forEach((value, key) => {
        // Skip certain headers that might cause issues
        if (!["content-length", "host"].includes(key.toLowerCase())) {
          fetchHeaders.set(key, value);
        }
      });

      // Return the fetch with the combined headers
      return fetch(`${API_URL}/${path}`, {
        cache: "no-store",
        ...options,
        headers: fetchHeaders,
      });
    };
    resolve(createManifestClient(apiClient));
  });

  return client;
};
