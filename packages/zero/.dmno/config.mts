import { DmnoBaseTypes, defineDmnoService } from "dmno";

export default defineDmnoService({
  // no `name` specified - will inherit from package.json
  schema: {
    VITE_PUBLIC_SERVER: {
      extends: DmnoBaseTypes.url,
    },
    AUTH_PEPPER: {
      sensitive: true,
      required: true,
    },
    ZERO_UPSTREAM_DB: {
      sensitive: true,
      required: true,
    },
    ZERO_AUTH_SECRET: {
      sensitive: true,
      required: true,
    },
    ZERO_REPLICA_FILE: {
      sensitive: true,
      required: true,
    },
    ZERO_LOG_LEVEL: {
      sensitive: true,
    },
    NODE_ENV: {},
  },
});
