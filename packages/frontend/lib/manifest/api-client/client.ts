import { createManifestClient, ManifestClient } from "./common";

export const getManifestClient = (): ManifestClient => {
  return createManifestClient(fetch);
};
