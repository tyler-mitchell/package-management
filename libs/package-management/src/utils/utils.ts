import type {
  Select,
  SelectionMap,
  Entry,
  EntryOf,
  FromEntries,
  __,
  CheckResult,
  RequireExactlyOne,
  Prettify,
  SingleProp,
} from "@/types";
import { normalize as crossEnvPathNormalizer } from "pathe";
import { promises as fs } from "node:fs";

export const toArray = <t>(data: t) =>
  (Array.isArray(data) ? data : [data]) as t extends readonly unknown[]
    ? t
    : t[];

export const entriesOf = <O extends object>(o: O) =>
  Object.entries(o) as EntryOf<O>[];

export const fromEntries = <const Entries extends readonly Entry[]>(
  entries: Entries
) => Object.fromEntries(entries) as __<FromEntries<Entries>>;

export const notFalsy = <T>(value: T | null | undefined | false): value is T =>
  [false, null, undefined].every((v) => v !== value);

export const select = <
  T extends object,
  TSelection extends SelectionMap<T>,
  TMode extends "true:pick" | "true:omit" = "true:pick",
>(
  obj: T,
  selection?: TSelection,
  mode?: TMode
): Select<T, TSelection, TMode> => {
  if (!selection) return obj;

  const filtered = entriesOf(obj).filter(([key]) => {
    return mode === "true:omit" ? !selection[key] : selection[key];
  });
  return fromEntries(filtered) as never;
};

export function defaults<
  T extends object,
  D extends
    | {
        [K in keyof T as undefined extends T[K] ? K : never]: T[K];
      }
    | undefined,
>(obj: T | undefined, defaults: D): __<T & NonNullable<D>> {
  return Object.assign({}, defaults, obj);
}

interface A {
  a?: boolean;
  b?: boolean;
  c: boolean;
}

export async function pathExists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export function normalizePath(
  path: string,
  option?: boolean | ((path: string) => string)
) {
  if (typeof option === "function") {
    return normalizePath(path);
  }

  if (option === false) {
    return path;
  }

  return crossEnvPathNormalizer(path);
}

export function isVersionNumber(version: string) {
  const versionRegex = /^\d+\.\d+\.\d+$/;
  return versionRegex.test(version);
}

interface Invariant {
  (predicate: unknown, message: string): asserts predicate;
}

export const invariant: Invariant = (predicate, message) => {
  if (!predicate) {
    throw new Error(message);
  }
};

export function getArrayItemAtOffset<T>(
  arr?: T[],
  index?: number,
  offset: number = 0
) {
  // `index` is a position, so `0` is valid and must not be treated as absent.
  if (arr === undefined || index === undefined) return undefined;
  return arr[index + offset];
}

export function isMatching(a: string | undefined, b: string | undefined) {
  if (!a || !b) return false;
  return a === b;
}

export function checkResult<
  $data,
  $error = Error,
  $data_key extends string = "data",
  $error_key extends string = "error",
>(
  cb: () => $data,
  options?: {
    keys?: {
      data?: $data_key;
      error?: $error_key;
    };
  }
): CheckResult<$data, $error, $data_key, $error_key> {
  try {
    return buildSingleProp({
      key: options?.keys?.data ?? "data",
      value: cb(),
    }) as any;
  } catch (error) {
    return buildSingleProp({
      key: options?.keys?.error ?? "error",
      value: error,
    }) as any;
  }
}

function isPropertyKey(input: unknown): input is PropertyKey {
  return (
    typeof input === "string" ||
    typeof input === "number" ||
    typeof input === "symbol"
  );
}

export function buildSingleProp<$key extends PropertyKey, $value>(
  entry:
    | {
        key: $key;
        value: $value;
      }
    | [key: $key, value: $value]
): SingleProp<$key, $value> {
  const [key, value] = Array.isArray(entry) ? entry : [entry.key, entry.value];

  if (!isPropertyKey(key)) {
    return {} as SingleProp<$key, $value>;
  }

  return { [key]: value } as SingleProp<$key, $value>;
}
