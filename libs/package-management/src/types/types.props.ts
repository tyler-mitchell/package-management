import type { Split as SplitString } from "string-ts";

export type KeyOf<T, K> = K extends keyof T ? K : never;

export type ValueKeyOf<T, K> = T[KeyOf<T, K>];

export type ValueAtPath<T, $dot_path extends string> = ValueKeyOfDeep<
  Extract<T, object>,
  SplitString<$dot_path, ".">
>;

export type ValueKeyOfDeep<T, $path extends PropertyKey[]> = $path extends [
  infer K,
  ...infer $Path,
]
  ? ValueKeyOfDeep<ValueKeyOf<T, K>, Extract<$Path, PropertyKey[]>>
  : T;
