import { createManifestClient, ManifestClient } from "./common";
import { loggedFetch } from "./logged-fetch";

export const getManifestClient = (): ManifestClient => {
  return createManifestClient(loggedFetch("CLIENT"));
};
