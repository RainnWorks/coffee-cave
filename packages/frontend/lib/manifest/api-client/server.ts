"use server";

import { cookies, headers } from "next/headers";
import { APIClient, createManifestClient, ManifestClient } from "./common";
import { loggedFetch } from "./logged-fetch";

let client: Promise<ManifestClient> | null = null;

/**
 * Creates a fetch function that automatically includes the server headers
 * @returns A ManifestClient instance with server headers automatically included
 */
export const getServerManifestClient = async (): Promise<ManifestClient> => {
  if (client) return await client;

  client = new Promise<ManifestClient>(async (resolve) => {
    // Create the API client function that includes server headers
    const apiClient: APIClient = async (
      path: string,
      options: RequestInit = {}
    ) => {
      // Create a new headers object from the existing options.headers (if any)
      const headersList = await headers();
      const fetchHeaders = new Headers(options.headers);
      // Add all headers from the server request
      headersList.forEach((value, key) => {
        // Skip certain headers that might cause issues
        if (
          !["content-type", "content-length", "host"].includes(
            key.toLowerCase()
          )
        ) {
          fetchHeaders.set(key, value);
        }
      });

      const cookie = await cookies();

      // Get the auth_token cookie if it exists and add to Authorization header
      const authToken = cookie.get("auth_token");
      if (authToken) {
        fetchHeaders.set("Authorization", `Bearer ${authToken.value}`);
      }
      // Return the fetch with the combined headers
      return loggedFetch("SERVER")(`http://localhost:1111${path}`, {
        cache: "no-store",
        ...options,
        headers: fetchHeaders,
      });
    };
    resolve(createManifestClient(apiClient));
  });

  return client;
};
