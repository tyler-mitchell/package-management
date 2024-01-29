import type {
  Select,
  SelectionMap,
  Entry,
  EntryOf,
  FromEntries,
  __,
  Func,
  PickByValue,
} from "@/types";
import { normalize as crossEnvPathNormalizer } from "pathe";
import { promises as fs } from "node:fs";

export { execa as $$ } from "execa";

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
  TMode extends "pick" | "omit" = "pick",
>(
  obj: T,
  selection?: TSelection,
  mode?: TMode
): Select<T, TSelection, TMode> => {
  if (!selection) return obj;

  const filtered = entriesOf(obj).filter(([key]) => {
    return mode === "omit" ? !selection[key] : selection[key];
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
