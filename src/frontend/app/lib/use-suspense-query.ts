import {useRef, useSyncExternalStore} from 'react';
import type {
    Format,
    Query,
  ReadonlyJSONValue,
  ResultType,
  TTL,
  TypedView,
  Zero,
} from '@rocicorp/zero';

// If your typed-view module doesn't export Listener, use this locally:
// type Listener<T> = (data: Immutable<T>, resultType: ResultType) => void;

export type QueryResultDetails = Readonly<{ type: ResultType }>;
export type QueryResult<TReturn> = readonly [HumanReadable<TReturn>, QueryResultDetails];

// If HumanReadable isn't exported at this path, re-use the type you already have:
import type {HumanReadable} from '@rocicorp/zero';
import type { Schema } from '../../../schema.ts';
import { useZero } from '@rocicorp/zero/react';

// ---------- Immutable snapshot helpers (mirrors useQuery impl) ----------
const resultTypeUnknown = { type: 'unknown' } as const;
const resultTypeComplete = { type: 'complete' } as const;

const emptyArray: unknown[] = [];
const emptySnapshotSingularUnknown = [undefined, resultTypeUnknown] as const;
const emptySnapshotSingularComplete = [undefined, resultTypeComplete] as const;
const emptySnapshotPluralUnknown = [emptyArray, resultTypeUnknown] as const;
const emptySnapshotPluralComplete = [emptyArray, resultTypeComplete] as const;

function getDefaultSnapshot<TReturn>(singular: boolean): QueryResult<TReturn> {
  return (singular
    ? emptySnapshotSingularUnknown
    : emptySnapshotPluralUnknown) as unknown as QueryResult<TReturn>;
}

function getSnapshot<TReturn>(
  singular: boolean,
  data: HumanReadable<TReturn>,
  resultType: ResultType,
): QueryResult<TReturn> {
  if (singular && data === undefined) {
    return (resultType === 'complete'
      ? emptySnapshotSingularComplete
      : emptySnapshotSingularUnknown) as unknown as QueryResult<TReturn>;
  }
  if (!singular && (data as unknown[]).length === 0) {
    return (resultType === 'complete'
      ? emptySnapshotPluralComplete
      : emptySnapshotPluralUnknown) as unknown as QueryResult<TReturn>;
  }
  return [
    data,
    resultType === 'complete' ? resultTypeComplete : resultTypeUnknown,
  ] as const;
}

// ---------- A minimal, Suspense-aware wrapper built on materialize ----------
type EntryKey = string;

/** Narrow, generic-agnostic interface for cache entries (no `any`). */
interface EntryBase {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => QueryResult<unknown>;
  updateTTL: (ttl: TTL) => void;
  readonly firstCompletionPromise: Promise<void>;
  readonly isCompleteNow: boolean;
  destroy(): void;
}

// util (top of file or near Entry)
function cloneForSnapshot<T>(value: T): T {
    if (value === undefined || value === null) return value;
    // Prefer structuredClone when available (modern browsers/Node)
    const sc = (globalThis as unknown as { structuredClone?: <U>(v: U) => U })
      .structuredClone;
    if (typeof sc === 'function') {
      try {
        return sc(value);
      } catch {
        // fall through to JSON fallback
      }
    }
    // Fallback: fine for HumanReadable/JSON-like data
    try {
      return JSON.parse(JSON.stringify(value)) as T;
    } catch {
      // Worst case: return as-is (assumes upstream won’t mutate)
      return value;
    }
  }

class Entry<TSchema extends Schema, TTable extends keyof TSchema['tables'] & string, TReturn>
  implements EntryBase
{
  #query: Query<TSchema, TTable, TReturn>;
  #format: Format;
  #ttl: TTL;
  #view: TypedView<HumanReadable<TReturn>> | undefined;
  #listeners = new Set<() => void>();
  #cleanupTimer: ReturnType<typeof setTimeout> | null = null;
  #hasCompletedOnce = false;

  #snapshot: QueryResult<TReturn>;
  #resolveFirst!: () => void;
  readonly firstCompletionPromise: Promise<void>;

  constructor(query: Query<TSchema, TTable, TReturn>, format: Format, ttl: TTL) {
    this.#query = query;
    this.#format = format;
    this.#ttl = ttl;
    this.#snapshot = getDefaultSnapshot<TReturn>(format.singular);

    this.firstCompletionPromise = new Promise<void>((resolve) => {
      this.#resolveFirst = resolve;
    });

    // Materialize immediately so the promise can resolve while the tree is suspended.
    this.#materializeIfNeeded();
  }

  get isCompleteNow(): boolean {
    return this.#snapshot[1].type === 'complete';
  }

  #onView: (data: HumanReadable<TReturn>, resultType: ResultType) => void = (
    snap,
    resultType,
  ) => {
    const data =
      snap === undefined
        ? snap
        : (cloneForSnapshot(snap as ReadonlyJSONValue) as HumanReadable<TReturn>);

    this.#snapshot = getSnapshot<TReturn>(this.#format.singular, data, resultType);

    if (resultType === 'complete' && !this.#hasCompletedOnce) {
      this.#hasCompletedOnce = true;
      this.#resolveFirst();
    }

    for (const l of this.#listeners) l();
  };

  #materializeIfNeeded(): void {
    if (this.#view) return;
    this.#view = this.#query.materialize(this.#ttl);
    // Important: the view must invoke listeners with (data, resultType).
    this.#view.addListener(this.#onView as any);
  }

  subscribe = (listener: () => void): (() => void) => {
    if (this.#cleanupTimer) {
      clearTimeout(this.#cleanupTimer);
      this.#cleanupTimer = null;
    }
    this.#listeners.add(listener);
    // Ensure live materialization while there is at least one subscriber.
    this.#materializeIfNeeded();

    return () => {
      this.#listeners.delete(listener);
      if (this.#listeners.size === 0) {
        // Defer cleanup slightly to absorb StrictMode mount/unmount remount.
        this.#cleanupTimer = setTimeout(() => {
          if (this.#listeners.size === 0) {
            this.destroy();
          }
        }, 10);
      }
    };
  };

  getSnapshot = (): QueryResult<TReturn> => this.#snapshot;

  updateTTL(ttl: TTL): void {
    this.#ttl = ttl;
    this.#view?.updateTTL(ttl);
  }

  destroy(): void {
    if (!this.#view) return;
    this.#view.destroy();
    this.#view = undefined;
  }
}

// ---------- Global cache keyed by (query.hash + clientID) ----------
const cache: Map<EntryKey, EntryBase> = new Map();

function getKey<TSchema extends Schema, TTable extends keyof TSchema['tables'] & string, TReturn>(
  zero: Zero<TSchema>,
  query: Query<TSchema, TTable, TReturn>,
): string {
  // Same strategy as useQuery/ViewStore to ensure sharing.
  return query.hash() + zero.clientID;
}

function getOrCreateEntry<
  TSchema extends Schema,
  TTable extends keyof TSchema['tables'] & string,
  TReturn,
>(
  zero: Zero<TSchema>,
  query: Query<TSchema, TTable, TReturn>,
  ttl: TTL,
): Entry<TSchema, TTable, TReturn> {
  // Important: delegate before hashing/materializing
  // so we bind the query to the current Zero instance.
  const delegated = query.delegate(zero.queryDelegate) as Query<TSchema, TTable, TReturn>;
  const key = getKey(zero, delegated);

  const existing = cache.get(key) as Entry<TSchema, TTable, TReturn> | undefined;
  if (existing) {
    existing.updateTTL(ttl);
    return existing;
  }

  const entry = new Entry(delegated, (delegated as unknown as { format: Format }).format, ttl);
  cache.set(key, entry);
  return entry;
}

// ---------- Public hook ----------
export type UseQueryOptions = {
  enabled?: boolean | undefined;
  ttl?: TTL | undefined;
};

const DEFAULT_TTL_MS = "5m";

/**
 * Suspends only on the initial render until the materialized view first reaches `ResultType === "complete"`.
 * After the first completion it never re-suspends for that component, even if the view revalidates later.
 */
export function useSuspenseQuery<
  TSchema extends Schema,
  TTable extends keyof TSchema['tables'] & string,
  TReturn,
>(
  query: Query<TSchema, TTable, TReturn>,
  options?: UseQueryOptions | boolean,
): QueryResult<TReturn> {
  let enabled = true;
  let ttl: TTL = DEFAULT_TTL_MS;
  if (typeof options === 'boolean') {
    enabled = options;
  } else if (options) {
    ({ enabled = true, ttl = DEFAULT_TTL_MS } = options);
  }

  const zero = useZero<TSchema>();

  // Disabled: do not materialize, do not suspend.
  if (!enabled) {
    const singular = (query as unknown as { format: Format }).format.singular;
    return getDefaultSnapshot<TReturn>(singular);
  }

  // Get a shared, already-materialized entry (or create one).
  const entry = getOrCreateEntry(zero, query, ttl);

  // Subscribe first (via useSyncExternalStore) so the view stays live during retries.
  const snapshot = useSyncExternalStore<QueryResult<TReturn>>(
    entry.subscribe,
    entry.getSnapshot as () => QueryResult<TReturn>,
    entry.getSnapshot as () => QueryResult<TReturn>,
  );

  // Component-scoped "completed once" latch.
  const hasCompletedOnceRef = useRef<boolean>(entry.isCompleteNow);
  if (!hasCompletedOnceRef.current) {
    if (!entry.isCompleteNow) {
      // Suspend until the *view* (outside React) reports first completion.
      throw entry.firstCompletionPromise;
    }
    hasCompletedOnceRef.current = true;
  }

  return snapshot;
}