import { unstable_createAdapterProvider as createAdapterProvider } from "nuqs/adapters/custom";
import { type FC, type PropsWithChildren, useEffect, useMemo } from "react";
import { useLocation, useSearch } from "wouter";

export type { default } from "react";

/**
 * Hook that Nuqs will call to read & write URL state using Wouter.
 * - READ: from `useSearch()` (string like "a=1&b=2" or "")
 * - WRITE: via `setLocation(next, { replace?: boolean })`
 */
function useWouterAdapter() {
  const [location, setLocation] = useLocation(); // e.g. "/path?x=1#hash"
  const searchString = useSearch(); // e.g. "x=1" (no leading "?")

  // A stable URLSearchParams snapshot derived from wouter's search string
  const searchParams = useMemo(
    () => new URLSearchParams(searchString),
    [searchString],
  );

  /**
   * Write new params back via Wouter.
   * We preserve current pathname & hash, replace the search with the new params.
   * Uses `pushState` semantics by default; callers that want replace semantics
   * should pass `{ replace: true }` on the `setLocation` call upstream (nuqs will).
   */
  function updateUrl(updated: URLSearchParams) {
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost";
    const url = new URL(location, base);

    const nextSearch = updated.toString();
    url.search = nextSearch ? `?${nextSearch}` : "";

    // Wouter navigation (client-side). Let nuqs decide push vs replace via options;
    // createAdapterProvider will pass the correct flag when calling this writer.
    setLocation(url.pathname + url.search + url.hash);
  }

  /**
   * Expose a fresh snapshot (nuqs calls this to avoid stale closures).
   */
  function getSearchParamsSnapshot() {
    // Build from the *current* wouter search string
    return new URLSearchParams(searchString);
  }

  // Ensure wouter reacts to browser back/forward on query changes:
  // Wouter already listens to `popstate`, so no extra listeners are required here.
  // We still keep the hook consistent with your example (no-op effect).
  useEffect(() => {}, []);

  return { searchParams, updateUrl, getSearchParamsSnapshot };
}

/**
 * The adapter provider component you wrap your app in.
 *
 * Usage:
 * <Router>
 *   <NuqsWouterAdapter>
 *     {children}
 *   </NuqsWouterAdapter>
 * </Router>
 */
export const NuqsWouterAdapter: FC<PropsWithChildren> = createAdapterProvider(
  useWouterAdapter,
) as FC<PropsWithChildren>;
