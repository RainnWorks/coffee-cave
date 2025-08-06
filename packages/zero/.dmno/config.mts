import { DmnoBaseTypes, defineDmnoService } from "dmno";

export default defineDmnoService({
  // no `name` specified - will inherit from package.json
  schema: {
    VITE_PUBLIC_SERVER: {
      extends: DmnoBaseTypes.url,
    },
    
    // Authentication secrets
    AUTH_PEPPER: {
      sensitive: true,
      required: true,
      description: 'Application-wide pepper for password hashing',
    },
    REFRESH_JWT_SECRET: {
      sensitive: true,
      required: true,
      description: 'Secret for signing refresh JWTs (long-lived cookies)',
    },
    ZERO_AUTH_SECRET: {
      sensitive: true,
      required: true,
      description: 'Secret for signing Zero Access JWTs (short-lived tokens)',
    },
    
    // Auth settings
    REFRESH_TTL_DAYS: {
      extends: DmnoBaseTypes.number,
      description: 'Refresh JWT TTL in days',
      value: 7
    },
    
    // Zero configuration
    ZERO_UPSTREAM_DB: {
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
    
    // Environment
    NODE_ENV: {},
  },
});
