import type { AsyncCacheFn as _AsyncCacheFn } from "async-cache-fn";
import type { Split } from "string-ts";

export type Equals<A1 extends any, A2 extends any> =
  (<A>() => A extends A2 ? 1 : 0) extends <A>() => A extends A1 ? 1 : 0 ? 1 : 0;

export type Cast<A1 extends any, A2 extends any> = A1 extends A2 ? A1 : A2;

export type __<T> = { [K in keyof T]: T[K] } & {};

export type Prettify<T> = { [K in keyof T]: T[K] } & {};

export type ValueOf<T> = T[keyof T];

export type EnumToLiteral<T extends string | number> = T extends string
  ? `${T}`
  : `${T}` extends `${infer N extends number}`
    ? N
    : never;

export type IsUnknown<t> = unknown extends t
  ? [t] extends [{}]
    ? false
    : true
  : false;

export type IsNever<T> = [T] extends [never] ? true : false;

export type AnyFunction = (...args: any[]) => any;

export type StringLiteral<T extends string> = T | (string & {});

export type Awaitable<T> = T | Promise<T>;

export type ResolvedPromise<T> = T extends Promise<infer U> ? U : never;

export type KeyOf<T, K> = K extends keyof T ? K : never;

export type ValueKeyOf<T, K> = T[KeyOf<T, K>];

export type ValueAtPath<T, $dot_path extends string> = ValueKeyOfDeep<
  Extract<T, object>,
  Split<$dot_path, ".">
>;

export type ValueKeyOfDeep<T, $path extends PropertyKey[]> = $path extends [
  infer K,
  ...infer $Path,
]
  ? ValueKeyOfDeep<ValueKeyOf<T, K>, Extract<$Path, PropertyKey[]>>
  : T;

export type PickKeyOf<T, K extends keyof T> = K extends keyof T ? K : never;

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

export type IsExactBoolean<T> = Equals<T, boolean> extends 1 ? true : false;

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
  TMode extends "true:pick" | "true:omit",
> = __<
  UnionizedSelectionMap<
    T,
    TSelection,
    TMode extends "true:pick"
      ? Pick<T, KeyOf<T, keyof PickByValue<TSelection, true>>>
      : Omit<T, KeyOf<T, keyof PickByValue<TSelection, true>>>
  >
>;

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

export type RequireExactlyOne<
  ObjectType,
  KeysType extends keyof ObjectType = keyof ObjectType,
> = {
  [Key in KeysType]: Required<Pick<ObjectType, Key>> &
    Partial<Record<Exclude<KeysType, Key>, never>>;
}[KeysType] &
  Omit<ObjectType, KeysType>;

export type OmitNever<T> = Omit<
  T,
  { [K in keyof T]: T[K] extends never ? K : never }[keyof T]
> & {};

export type OmitByValue<T, V> = OmitNever<{
  [K in keyof T]: T[K] extends V ? never : T[K];
}>;

export type NoInfer<T> = [T][T extends any ? 0 : never];

export type SingleProp<$key, $value> = Prettify<
  FromEntries<[[key: $key & PropertyKey, value: $value]]>
>;
