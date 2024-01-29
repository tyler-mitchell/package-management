import type { AsyncCacheFn as _AsyncCacheFn } from "async-cache-fn";
export type __<T> = { [K in keyof T]: T[K] } & {};

export type Func = (...args: any[]) => any;

export type StringLiteral<T extends string> = T | (string & {});

export type Awaitable<T> = T | Promise<T>;

export type ResolvedPromise<T> = T extends Promise<infer U> ? U : never;

export type KeyOf<T, K> = K extends keyof T ? K : never;

export type KeyOfValue<T, K> = T[KeyOf<T, K>];

export type SelectionMap<T> = __<{
  [K in keyof T]?: boolean;
}>;

// export type SelectionOption<T> = Partial<SelectionMap<T>>;

export type PickByValue<T, V> = {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};

export type Entry<
  key extends PropertyKey = PropertyKey,
  value = unknown,
> = readonly [key: key, value: value];

export type EntryOf<O> = {
  [k in keyof O]-?: [k, O[k] & ({} | null)];
}[O extends readonly unknown[] ? keyof O & number : keyof O] &
  unknown;

export type FromEntries<entries extends readonly Entry[]> = {
  [entry in entries[number] as entry[0]]: entry[1];
};

type UnionizedSelectionMap<T, TSelection extends SelectionMap<T>, V> = __<
  V & {
    [K in keyof T as IsExactBoolean<TSelection[K]> extends true
      ? K
      : never]?: T[K];
  }
>;

export type Select<
  T,
  TSelection extends SelectionMap<T>,
  TMode extends "pick" | "omit",
> = __<
  UnionizedSelectionMap<
    T,
    TSelection,
    TMode extends "pick"
      ? Pick<T, KeyOf<T, keyof PickByValue<TSelection, true>>>
      : Omit<T, KeyOf<T, keyof PickByValue<TSelection, true>>>
  >
>;

export type IsExactBoolean<T> = true extends T
  ? false extends T
    ? true
    : false
  : false;

export type IsUnion<T, U = T> = T extends U
  ? [U] extends [T]
    ? false
    : true
  : never;

export type MergeObject<
  T extends object,
  O extends object | unknown = unknown,
> = __<T & (O extends object ? O : Record<never, never>)>;

export type OmitIndexSignature<ObjectType> = {
  [KeyType in keyof ObjectType as {} extends Record<KeyType, unknown>
    ? never
    : KeyType]: ObjectType[KeyType];
};
