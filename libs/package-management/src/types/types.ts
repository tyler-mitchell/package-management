import type { AsyncCacheFn as _AsyncCacheFn } from "async-cache-fn";
import type {
  FromEntries,
  Prettify,
  RequireExactlyOne,
  SingleProp,
} from "./type-utils";
import type { Any } from "ts-toolbelt";

export interface PathOptions {
  cwd?: string;
}

export type AsyncCacheFn<
  TReturn = unknown,
  TOption extends object | undefined = undefined,
  C extends "required" | "optional" = "optional",
> = _AsyncCacheFn<
  TReturn,
  C extends "optional" ? [TOption | undefined] | [] : [TOption]
>;

export type CheckResult<
  $data,
  $error = Error,
  $data_key extends string = "data",
  $error_key extends string = "error",
> =
  // prettier-ignore
  Prettify<
    RequireExactlyOne<
      SingleProp<$data_key, $data> & 
      SingleProp<$error_key, $error>
    >
  >;
