import { defineDmnoService, DmnoBaseTypes, NodeEnvType, switchBy } from "dmno";

export default defineDmnoService({
  schema: {
    // General Variables
    NODE_ENV: {
      extends: NodeEnvType,
      description:
        "The app environment. For production and staging instances, it should be set to production, mostly to turn off live reload on file change.",
      value: "development",
      required: false, // Has a default value
    },
    PORT: {
      extends: DmnoBaseTypes.port,
      description:
        "The port of your app. You can either adapt your server settings to listen to 1111 or change here to your server's default (usually 3000).",
      value: 1111,
      required: false, // Has a default value
    },
    BASE_URL: {
      extends: DmnoBaseTypes.url,
      // TODO: This default depends on PORT, DMNO might need a way to reference other values. Hardcoding for now.
      description:
        "The base url of your backend. Change it when deploying if you use file or image upload.",
      value: "http://localhost:1111",
      required: false, // Has a default value
    },
    OPEN_API_DOCS: {
      extends: DmnoBaseTypes.boolean,
      description:
        "Determines whether the OpenAPI doc is shown (formerly Swagger) for your REST API at /api. Make sure to set to true if you want to display on production.",
      // Default depends on NODE_ENV, requires switchBy or similar logic.
      // Setting a sensible default for now. User should configure based on NODE_ENV.
      value: switchBy("NODE_ENV", {
        production: false,
        _default: true, // Default to true for non-production environments
      }),
      required: false, // Has a default mechanism
    },

    // Paths
    PUBLIC_FOLDER: {
      extends: DmnoBaseTypes.string,
      description: "The public folder to show static files.",
      value: "/public",
      required: false, // Has a default value
    },
    MANIFEST_HANDLERS_FOLDER: {
      extends: DmnoBaseTypes.string,
      description:
        "The folder to put your handlers functions for custom endpoints.",
      value: "/manifest/handlers",
      required: false, // Has a default value
    },
    MANIFEST_FILE_PATH: {
      extends: DmnoBaseTypes.string,
      description: "The relative or absolute path of your Manifest YAML file.",
      value: "/manifest/backend.yml",
      required: false, // Has a default value
    },
    TOKEN_SECRET_KEY: {
      extends: DmnoBaseTypes.string,
      description:
        "The secret key behind the JWT authentication. Required on production.",
      sensitive: true,
      required: false, // Not strictly required unless NODE_ENV=production. Add validation if needed.
      // Consider adding custom validation to enforce requirement in production
    },

    // Database
    DB_CONNECTION: {
      extends: DmnoBaseTypes.enum(["sqlite", "postgres", "mysql"]),
      description:
        "Choose postgres switching to PostgreSQL or mysql for MySQL or MariaDB.",
      value: "sqlite",
      required: false, // Has a default value
    },
    DB_PATH: {
      extends: DmnoBaseTypes.string,
      description:
        "Path of the database. Your server should have access to this path locally. (Applies To: SQLite)",
      value: "/manifest/backend.db",
      required: false, // Has a default value, only relevant for sqlite
    },
    DB_HOST: {
      extends: DmnoBaseTypes.string, // Could use ipAddress or hostname type if available/needed
      description: "Database host. (Applies To: PostgreSQL / MySQL)",
      value: "localhost",
      required: false, // Has a default value, only relevant for postgres/mysql
    },
    DB_PORT: {
      extends: DmnoBaseTypes.port,
      description: "Database port. (Applies To: PostgreSQL / MySQL)",
      value: 5432,
      required: false, // Has a default value, only relevant for postgres/mysql
    },
    DB_USERNAME: {
      extends: DmnoBaseTypes.string,
      description: "Database username. (Applies To: PostgreSQL / MySQL)",
      value: "postgres",
      required: false, // Has a default value, only relevant for postgres/mysql
    },
    DB_PASSWORD: {
      extends: DmnoBaseTypes.string,
      description: "Database password. (Applies To: PostgreSQL / MySQL)",
      value: "postgres",
      sensitive: true,
      required: false, // Has a default value, only relevant for postgres/mysql
    },
    DB_DATABASE: {
      extends: DmnoBaseTypes.string,
      description: "Database name. (Applies To: PostgreSQL / MySQL)",
      value: "manifest",
      required: false, // Has a default value, only relevant for postgres/mysql
    },
    DB_SSL: {
      extends: DmnoBaseTypes.boolean,
      description:
        "Require SSL for DB connection. Set to true if using remote DB. (Applies To: PostgreSQL / MySQL)",
      value: false,
      required: false, // Has a default value, only relevant for postgres/mysql
    },

    // S3 Storage Configuration
    S3_BUCKET: {
      extends: DmnoBaseTypes.string,
      description: "S3 bucket name for asset storage",
      required: false,
    },
    S3_ENDPOINT: {
      extends: DmnoBaseTypes.url,
      description: "S3 service endpoint URL (e.g., https://your-s3-provider.com)",
      required: false,
    },
    S3_REGION: {
      extends: DmnoBaseTypes.string,
      description: "AWS region for S3 bucket",
      required: false,
    },
    S3_ACCESS_KEY_ID: {
      extends: DmnoBaseTypes.string,
      description: "Access key ID for S3 authentication",
      sensitive: true,
      required: false,
    },
    S3_SECRET_ACCESS_KEY: {
      extends: DmnoBaseTypes.string,
      description: "Secret access key for S3 authentication",
      sensitive: true,
      required: false,
    },
  },
});
