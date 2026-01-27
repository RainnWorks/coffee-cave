// immutable.ts

/** Atomic types treated as already-immutable */
type Primitive = null | undefined | string | number | boolean | symbol | bigint;
type Fn = (...args: never[]) => unknown;
type Builtin = Primitive | Date | RegExp | Error | Fn;

/**
 * Deeply makes T immutable:
 * - Objects: recursively readonly
 * - Arrays/Tuples: readonly and element-wise immutable (tuples keep their shape)
 * - Map/Set: converted to ReadonlyMap/ReadonlySet with immutable keys/values
 * - WeakMap/WeakSet: kept as-is (no readonly variants exist)
 * - Promise: preserves the promise but immutabilizes the resolved type
 * - Builtins/functions/primitives: left as-is
 */
export type Immutable<T> =
  // Leave built-ins and primitives as-is
  T extends Builtin
    ? T
    : // Promises: make the resolved type immutable
      T extends Promise<infer U>
      ? Promise<Immutable<U>>
      : // Maps/Sets (and readonly variants)
        T extends ReadonlyMap<infer K, infer V>
        ? ReadonlyMap<Immutable<K>, Immutable<V>>
        : T extends Map<infer K, infer V>
          ? ReadonlyMap<Immutable<K>, Immutable<V>>
          : T extends ReadonlySet<infer U>
            ? ReadonlySet<Immutable<U>>
            : T extends Set<infer U>
              ? ReadonlySet<Immutable<U>>
              : // Weak collections (no readonly types exist)
                T extends WeakMap<infer K, infer V>
                ? WeakMap<Immutable<K>, Immutable<V>>
                : T extends WeakSet<infer U>
                  ? WeakSet<Immutable<U>>
                  : // Tuples and readonly arrays: preserve shape/indices as readonly
                    T extends readonly unknown[]
                    ? { readonly [P in keyof T]: Immutable<T[P]> }
                    : // Mutable arrays: make readonly and immutabilize elements
                      T extends unknown[]
                      ? ReadonlyArray<Immutable<T[number]>>
                      : // Objects: recursively readonly
                        T extends object
                        ? { readonly [P in keyof T]: Immutable<T[P]> }
                        : // Fallback
                          T;
