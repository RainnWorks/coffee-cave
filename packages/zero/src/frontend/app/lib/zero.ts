import { useZero, useQuery, type UseQueryOptions } from "@rocicorp/zero/react";
import type { Schema } from "../../../schema";
import type { Query } from "@rocicorp/zero";

export const useTypedZero = () => {
  return useZero<Schema>();
};

import { useEffect, useRef } from "react";

type Deferred = { promise: Promise<void>; resolve: () => void };

function createDeferred(): Deferred {
  let resolveFn: () => void = () => {};
  const promise = new Promise<void>((res) => {
    resolveFn = res;
  });
  return { promise, resolve: resolveFn };
}

/**
 * Suspends only on the initial render until the query reaches `meta.type === "complete"`.
 * After first completion it never re-suspends, even if the reactive source revalidates.
 */
export function useSuspenseQuery<
  TSchema extends Schema,
  TTable extends keyof TSchema["tables"] & string,
  TReturn,
>(query: Query<TSchema, TTable, TReturn>, options?: UseQueryOptions | boolean) {
  const result = query.materialize();
  result.data
  const [data, meta] = useQuery<TSchema, TTable, TReturn>(query, options);

  // If we start complete, never suspend.
  const hasCompletedOnceRef = useRef<boolean>(meta.type === "complete");
  const deferredRef = useRef<Deferred | null>(null);

  // Resolve once we hit complete for the first time.
  useEffect(() => {
    if (!hasCompletedOnceRef.current && meta.type === "complete") {
      hasCompletedOnceRef.current = true;
      deferredRef.current?.resolve();
      deferredRef.current = null;
    }
  }, [meta.type]);

  // Trigger Suspense on first non-complete render.
  if (!hasCompletedOnceRef.current && meta.type !== "complete") {
    if (deferredRef.current === null) {
      deferredRef.current = createDeferred();
    }
    throw deferredRef.current.promise;
  }

  // Preserve the original tuple shape/types from useQuery.
  return [data, meta] as const;
}
