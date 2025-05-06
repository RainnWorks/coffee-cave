import { ReconciledTableSchema } from "../table-reconciler";
import {
  AllergenSchema,
  CategoryWithMenuItemsSchema,
  PaymentSchema,
  RestaurantConfigSchema,
  StaffSchema,
  TabItemWithMenuItemSchema,
  TabSchema,
} from "../types";
import { ManifestResponse, isManifestError, ManifestError } from "./types";
import { z } from "zod";
import { fromError } from "zod-validation-error";

export const API_URL = process.env.API_BASE_PATH || "http://localhost:3000";

export type APIClient = (
  path: string,
  options: RequestInit
) => Promise<Response>;

export type PaginatedResponse<T> = {
  data: T[];
  currentPage: number;
  lastPage: number;
  from: number;
  to: number;
  total: number;
  perPage: number;
};

/**
 * Filter suffixes for list operations
 *
 * @example
 * _eq - equals - isActive_eq=true
 * _neq - not equals - name_neq=alice
 * _gt - greater than - birthdate_gt=2020-01-01
 * _gte - greater than or equal - age_gte=4
 * _lt - less than - amount_lt=400
 * _lte - less than or equal - amount_lte=400
 * _like - like - name_like=%bi%
 * _in - included in - customer_in=1,2,3
 */
export type ListFilterSuffixes =
  | "_eq"
  | "_neq"
  | "_gt"
  | "_gte"
  | "_lt"
  | "_lte"
  | "_like"
  | "_in";

/**
 * Represents filter parameters for list operations
 *
 * @example
 * { name_eq: "john", age_gte: 18 }
 */
export type ListFilters<T extends object> = Partial<{
  [key in `${string & keyof T}${ListFilterSuffixes}`]:
    | string
    | number
    | boolean
    | null;
}>;

export type PaginationOptions = {
  page?: number;
  perPage?: number;
};

export type EntityType = "collections" | "single";

export type OrderOptions<T extends object> = {
  orderBy?: string & keyof T;
  order?: "ASC" | "DESC";
};

// Common options type for all API requests
export type ListOptions<T extends object> = {
  pagination?: PaginationOptions;
  order?: OrderOptions<T>;
  filters?: ListFilters<T>;
};

export type RequestOptions<T extends object> = ListOptions<T>;

// Common function to build URL search parameters from options
const buildSearchParams = <T extends object>(
  options?: RequestOptions<T> & { relations?: string[] }
): URLSearchParams => {
  const urlSearchParams = new URLSearchParams();

  if (!options) return urlSearchParams;

  // Helper to add parameters to the URL
  const addToSearchParams = (
    params: URLSearchParams,
    object: Record<string, unknown>
  ) => {
    Object.entries(object)
      .filter(([, value]) => value !== undefined)
      .forEach(([key, value]) => {
        params.append(key, (value as string | boolean | number).toString());
      });
  };

  if (options.filters) addToSearchParams(urlSearchParams, options.filters);
  if (options.order) addToSearchParams(urlSearchParams, options.order);
  if (options.pagination)
    addToSearchParams(urlSearchParams, options.pagination);
  if (options.relations) {
    addToSearchParams(urlSearchParams, {
      relations: options.relations.join(","),
    });
  }

  return urlSearchParams;
};

// Core fetch function that handles response parsing and error handling
const fetchWithErrorHandling = async <T>(
  goFetch: APIClient,
  url: string,
  schema?: z.ZodType<T>,
  options: RequestInit = {}
): Promise<ManifestResponse<T>> => {
  try {
    const result = await goFetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const resultJson = await result.json();

    if (isManifestError(resultJson)) {
      return {
        result: undefined,
        error: resultJson,
        errorMessage: resultJson.message,
      };
    }

    if (result.ok && result.status < 300 && result.status >= 200) {
      if (!schema)
        return {
          result: resultJson,
          error: undefined,
          errorMessage: undefined,
        };
      // Validate with Zod schema if provided
      try {
        const validatedData = schema.parse(resultJson);
        return {
          result: validatedData,
          error: undefined,
          errorMessage: undefined,
        };
      } catch (zodError) {
        if (zodError instanceof z.ZodError) {
          const error = fromError(zodError);
          console.error(JSON.stringify(resultJson, null, 2), zodError);
          return {
            result: undefined,
            error: error,
            errorMessage: error.message,
          };
        } else {
          return {
            result: undefined,
            error: zodError,
            errorMessage:
              zodError instanceof Error ? zodError.message : String(zodError),
          };
        }
      }
    }
    return {
      result: undefined,
      error: resultJson as ManifestError | unknown,
      errorMessage: (resultJson as ManifestError)?.message,
    };
  } catch (error) {
    return {
      result: undefined,
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
};

const buildUrl = (endpoint: string, params?: URLSearchParams): string => {
  const queryString = params?.toString() ? `?${params.toString()}` : "";
  return `${endpoint}${queryString}`;
};

// Define a type for PaginatedResponse with Zod schema
export const createPaginatedResponseSchema = <T>(schema: z.ZodType<T>) => {
  return z.object({
    data: z.array(schema),
    currentPage: z.number(),
    lastPage: z.number(),
    from: z.number(),
    to: z.number(),
    total: z.number(),
    perPage: z.number(),
  });
};

export const createAuthClient = (goFetch: APIClient, domain: string) => {
  return {
    login: async (
      email: string,
      password: string
    ): Promise<ManifestResponse<{ id: number }>> => {
      const params = buildSearchParams({});
      const endpoint = buildUrl(`/api/auth/${domain}/login`, params);
      return fetchWithErrorHandling<{ id: number }>(
        goFetch,
        endpoint,
        undefined,
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        }
      );
    },
    me: async (): Promise<ManifestResponse<{ id?: number; email?: string } | undefined>> => {
      const params = buildSearchParams({});
      const endpoint = buildUrl(`/api/auth/${domain}/me`, params);
      return fetchWithErrorHandling<{ id?: number; email?: string } | undefined>(
        goFetch,
        endpoint,
        undefined,
        {
          method: "GET",
        }
      );
    },
  };
};

export const createCollectionsClient = <Schema extends z.ZodType>(
  goFetch: APIClient,
  domain: string,
  schema: Schema,
  relations?: string[]
) => {
  // Use the inferred type from the schema
  type T = z.infer<Schema>;
  // Create a schema for paginated responses
  const paginatedSchema = createPaginatedResponseSchema(schema);

  // Create a nullable schema for single item responses
  const nullableSchema = z.union([schema, z.null()]);

  return {
    list: async (
      options?: ListOptions<T>
    ): Promise<ManifestResponse<PaginatedResponse<T>>> => {
      const params = buildSearchParams({ ...options, relations });
      const endpoint = buildUrl(`/api/collections/${domain}`, params);
      return fetchWithErrorHandling<PaginatedResponse<T>>(
        goFetch,
        endpoint,
        paginatedSchema
      );
    },

    getById: async (id: number): Promise<ManifestResponse<T | null>> => {
      const params = buildSearchParams({ relations });
      const endpoint = buildUrl(`/api/collections/${domain}/${id}`, params);
      return fetchWithErrorHandling<T | null>(
        goFetch,
        endpoint,
        nullableSchema
      );
    },
    create: async (
      data: DeepPartial<z.infer<Schema>> & Record<string, unknown>
    ): Promise<ManifestResponse<{ id: number }>> => {
      const params = buildSearchParams({ relations });
      const endpoint = buildUrl(`/api/collections/${domain}`, params);
      return fetchWithErrorHandling<{ id: number }>(
        goFetch,
        endpoint,
        undefined,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
    },
    update: async (
      id: number,
      data: DeepPartial<z.infer<Schema>> & Record<string, unknown>
    ): Promise<ManifestResponse<{ id: number }>> => {
      const params = buildSearchParams({ relations });
      const endpoint = buildUrl(`/api/collections/${domain}/${id}`, params);
      return fetchWithErrorHandling<{ id: number }>(
        goFetch,
        endpoint,
        undefined,
        {
          method: "PUT",
          body: JSON.stringify(data),
        }
      );
    },
    patch: async (
      id: number,
      data: DeepPartial<z.infer<Schema>> & Record<string, unknown>
    ): Promise<ManifestResponse<{ id: number }>> => {
      const params = buildSearchParams({ relations });
      const endpoint = buildUrl(`/api/collections/${domain}/${id}`, params);
      return fetchWithErrorHandling<{ id: number }>(
        goFetch,
        endpoint,
        undefined,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        }
      );
    },
    delete: async (id: number): Promise<ManifestResponse<void>> => {
      const params = buildSearchParams({ relations });
      const endpoint = buildUrl(`/api/collections/${domain}/${id}`, params);
      return fetchWithErrorHandling<void>(goFetch, endpoint, undefined, {
        method: "DELETE",
      });
    },
  };
};

// Domain-specific singles client that binds to a specific slug
export const createSinglesClient = <Schema extends z.ZodType>(
  goFetch: APIClient,
  slug: string,
  schema: Schema,
  relations?: string[]
) => {
  // Use the inferred type from the schema
  type T = z.infer<Schema>;
  // Create a nullable schema for responses
  const nullableSchema = z.union([schema, z.null()]);

  return {
    get: async (): Promise<ManifestResponse<T | null>> => {
      const params = buildSearchParams({ relations });
      const endpoint = buildUrl(`/api/singles/${slug}`, params);
      return fetchWithErrorHandling<T | null>(
        goFetch,
        endpoint,
        nullableSchema
      );
    },
  };
};

// Main manifest client that provides access to all domain-specific clients
export const createManifestClient = (goFetch: APIClient) => {
  return {
    staffAuth: createAuthClient(goFetch, "staff"),
    adminAuth: createAuthClient(goFetch, "admins"),
    tables: createCollectionsClient(goFetch, "tables", ReconciledTableSchema, [
      "tabs",
      "tabs.createdAt",
      "tabs.tabItems",
      "tabs.tabItems.menuItem",
      "tabs.tabItems.allergyRestrictions",
      "payments",
      "payments.tabItemsPaids",
    ]),
    admin: createCollectionsClient(goFetch, "admins", StaffSchema),
    staff: createCollectionsClient(goFetch, "staff", StaffSchema),
    restaurantConfig: createSinglesClient(
      goFetch,
      "restaurant-settings",
      RestaurantConfigSchema
    ),
    tabs: createCollectionsClient(goFetch, "tabs", TabSchema, [
      "tabItems",
      "tabItems.menuItem",
      "tabItems.allergyRestrictions",
    ]),
    tabItems: createCollectionsClient(
      goFetch,
      "tab-items",
      TabItemWithMenuItemSchema,
      ["allergyRestrictions", "menuItem", "menuItem.allergens"]
    ),
    categories: createCollectionsClient(
      goFetch,
      "categories",
      CategoryWithMenuItemsSchema,
      ["menuItems", "menuItems.allergens"]
    ),
    allergens: createCollectionsClient(goFetch, "allergens", AllergenSchema),
    payments: createCollectionsClient(goFetch, "payments", PaymentSchema),
  };
};

export type ManifestClient = ReturnType<typeof createManifestClient>;
