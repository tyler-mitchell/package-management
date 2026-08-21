import type {
  Prettify,
  ValueAtPath,
  ValueKeyOf,
  ValueKeyOfDeep,
  __,
} from "./type-utils";
import type { isAny, split as Split } from "@arktype/util";
import type { Compute } from "ts-toolbelt/out/Any/Compute";
import type { PathValue } from "@clickbar/dot-diver";
import type { O } from "ts-toolbelt";

type $GenericValue<
  $dot_path extends string,
  $when_undefined,
  $generics extends object | undefined,
> =
  ValueAtPath<$generics, $dot_path> extends infer V
    ? V extends undefined
      ? $when_undefined
      : V
    : never;

export interface $BooleanGenerics {
  /**
   *  Whether `T` should be matched against the truthiness defined in the `$literals` option
   */
  $allow_literal?: true;

  /**
   * A map of literal values that can be used to represent `true` or `false`
   */
  $literals?: {
    true: any[];
    false: any[];
  };

  /**
   * The type returned when `T` is of type `boolean` or `$literals['true' | 'false'][number]`
   *
   * @default T
   */
  $then?: "shit";

  /**
   * The type returned when `T` is not of type `boolean` or `$literals['true' | 'false][number]`
   *
   * @default never
   */
  $else?: any;

  /**
   *  Whether to exactly match types `true` or `false` or `boolean`
   */
  exact?: "boolean" | "true" | "false";
}

export type Boolean<
  T,
  $ extends $BooleanGenerics = $BooleanGenerics,
> = _Boolean<T, $>["result"];

interface _Boolean<T, $ extends $BooleanGenerics = $BooleanGenerics> {
  $true_literal: $GenericValue<`$literals.true.${number}`, "true", $>;
  $allow_literal: $GenericValue<`$allow_literal`, false, $>;
  $false_literal: $GenericValue<`$literals.true.${number}`, "false", $>;
  // $then: $GenericValue<`$then`, T, $>
  $then: ValueAtPath<$, "$then">;
  $else: ValueAtPath<$, "$else">;

  type_boolean: T extends boolean ? T : never;

  type_literal: T extends this["$true_literal"]
    ? true
    : T extends this["$false_literal"]
      ? false
      : this["type_boolean"];

  type: $["$allow_literal"] extends true
    ? this["type_literal"]
    : this["type_boolean"];

  exactly_boolean: true extends this["type"]
    ? false extends this["type"]
      ? this["$then"]
      : this["$else"]
    : this["$else"];

  exactly_true: true extends this["type"]
    ? false extends this["type"]
      ? this["$else"]
      : this["$then"]
    : this["$else"];

  exactly_false: false extends this["type"]
    ? true extends this["type"]
      ? this["$else"]
      : this["$then"]
    : this["$else"];

  boolean: this["type"] extends boolean ? this["$then"] : this["$else"];

  result: $["exact"] extends undefined
    ? this["boolean"]
    : ValueKeyOf<this, `exactly_${$["exact"]}`>;
}

type A = Compute<_Boolean<true>>;

type P = ValueKeyOfDeep<$BooleanGenerics, ["$literals", string]>;
type C = ValueAtPath<$BooleanGenerics, "$literals">;

// export type IsBoolean<T> = {
//   T_literal: T extends "true" ? true : T extends "false" ? false : never;
//   boolean: T extends boolean ? 1 : 0;
//   exactly_boolean: true extends T ? (false extends T ? 1 : 0) : 0;
//   exactly_true: true extends T ? (false extends T ? 0 : 1) : 0;
//   exactly_false: false extends T ? (true extends T ? 0 : 1) : 0;
// }[$exact extends undefined ? "boolean" : `exactly_${$exact}`];
