import { DmnoBaseTypes, ValidationError, defineDmnoService } from "dmno";

export default defineDmnoService({
  // no `name` specified - will inherit from package.json
  schema: {
    
    BACKEND_API_URL: {
      description: "API URL for the manifest service",
      required: true,
      value: 'http://localhost:1111',
    },
    API_BASE_PATH: {
      description: "API URL for the manifest service",
      required: true,
      value: 'http://localhost:3000',
    },
    EMAIL_DOMAIN: {
      extends: DmnoBaseTypes.string({
        toLowerCase: true
      }),
      required: true,
      value: 'coffee.cave',
      validate: (value: string) => {
        if (!value) {
          throw new ValidationError("Email domain is required");
        }
        if (value.startsWith("@")) {
          throw new ValidationError(
            "Email domain must not start with '@', use only the hostname: coffee.cave"
          );
        }
        if (value.endsWith(".")) {
          throw new ValidationError(
            "Email domain must not end with '.', use only the hostname: coffee.cave"
          );
        }
        if (!value.includes(".")) {
          throw new ValidationError(
            "Email domain must contain a dot, use only the hostname: coffee.cave"
          );
        }
      },
    },
  },
});
