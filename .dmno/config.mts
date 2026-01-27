import { DmnoBaseTypes, defineDmnoService } from "dmno";

export default defineDmnoService({
  // no `name` specified - will inherit from package.json
  schema: {
    BACKEND_BASE_URL: {
      extends: DmnoBaseTypes.url,
      required: true,
      sensitive: false,
    },
    ZERO_CACHE_SERVER: {
      extends: DmnoBaseTypes.url,
      required: true,
      sensitive: false,
    },

    // Authentication secrets
    AUTH_PEPPER: {
      sensitive: true,
      required: true,
      description: "Application-wide pepper for password hashing",
    },
    REFRESH_JWT_SECRET: {
      sensitive: true,
      required: true,
      description: "Secret for signing refresh JWTs (long-lived cookies)",
    },
    ACCESS_JWT_SECRET: {
      sensitive: true,
      required: true,
      description: "Secret for signing access JWTs (short-lived tokens)",
    },
    ZERO_AUTH_SECRET: {
      sensitive: true,
      required: true,
      description: "Secret for signing Zero Access JWTs (short-lived tokens)",
      value: () => DMNO_CONFIG.ACCESS_JWT_SECRET,
    },

    // Auth settings
    REFRESH_TTL_DAYS: {
      extends: DmnoBaseTypes.number,
      description: "Refresh JWT TTL in days",
      value: 7,
    },

    COOKIE_SECRET: {
      sensitive: true,
      required: true,
      description: "Secret for signing cookies",
    },

    // Zero configuration
    ZERO_UPSTREAM_DB: {
      sensitive: true,
      required: true,
    },
    ZERO_MUTATE_URL: {
      extends: DmnoBaseTypes.url,
      required: true,
      value: () => DMNO_CONFIG.BACKEND_BASE_URL + "/push",
    },
    ZERO_QUERY_URL: {
      extends: DmnoBaseTypes.url,
      required: true,
      value: () => DMNO_CONFIG.BACKEND_BASE_URL + "/query",
    },
    ZERO_REPLICA_FILE: {
      sensitive: true,
      required: true,
    },
    ZERO_LOG_LEVEL: {
      sensitive: true,
    },
    DO_NOT_TRACK: {
      value: 1,
    },

    // Environment
    NODE_ENV: {},
  },
});
