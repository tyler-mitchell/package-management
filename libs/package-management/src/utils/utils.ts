import type {
  Select,
  SelectionMap,
  Entry,
  EntryOf,
  FromEntries,
  __,
} from "@/types";
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

export async function pathExists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
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
