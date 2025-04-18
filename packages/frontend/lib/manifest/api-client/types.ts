export type ManifestError = {
  message?: string;
  error: string;
  statusCode?: number;
};

export type ManifestResponse<T> =
  | {
      result: T;
      error: undefined;
      errorMessage: undefined;
    }
  | {
      result: undefined;
      error: ManifestError | unknown;
      errorMessage: string | undefined;
    };

export const isManifestError = (error: unknown): error is ManifestError => {
  return typeof error === "object" && error !== null && "error" in error;
};
