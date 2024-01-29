import type { AsyncCacheFn as _AsyncCacheFn } from "async-cache-fn";

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
