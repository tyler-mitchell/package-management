import { afterEach, describe, expect, it } from "vitest";
import { pathToFileURL } from "node:url";
import { dirname, join } from "pathe";
import { _dirname, _filename } from "@/fs";
import { getPath } from "@/path";

const THIS_FILE = __filename;

const THIS_DIR = __dirname;

const originalStackTraceLimit = Error.stackTraceLimit;

afterEach(() => {
  Error.stackTraceLimit = originalStackTraceLimit;
});

describe("caller location from `from`", () => {
  it("resolves a module URL string to its path", () => {
    expect(_filename({ from: import.meta.url })).toBe(THIS_FILE);
    expect(_dirname({ from: import.meta.url })).toBe(THIS_DIR);
  });

  it("accepts a URL object", () => {
    expect(_filename({ from: pathToFileURL(THIS_FILE) })).toBe(THIS_FILE);
  });

  it("accepts a path that is already a path", () => {
    expect(_filename({ from: THIS_FILE })).toBe(THIS_FILE);
  });

  it("prefers `from` over the call stack", () => {
    const elsewhere = join(THIS_DIR, "somewhere-else.ts");

    // Nothing about the stack should be consulted once the caller has named
    // itself.
    expect(_filename({ from: pathToFileURL(elsewhere) })).toBe(elsewhere);
  });
});

describe("caller location from the call stack", () => {
  it("resolves the calling file with no `from` given", () => {
    expect(_filename({ boundaryFunctionName: "" })).toBe(THIS_FILE);
  });

  it("is not truncated by Error.stackTraceLimit", () => {
    const deep = (n: number): string | undefined =>
      n === 0 ? getPath({ to: ["<current_folder>"] }) : deep(n - 1);

    // `error.stack` yields nothing at all here, which is what the previous
    // implementation parsed. `getCallSites` takes its own frame count.
    Error.stackTraceLimit = 0;

    expect(deep(12)).toBe(THIS_DIR);
  });

  it("survives a deep call chain at the default limit", () => {
    const deep = (n: number): string | undefined =>
      n === 0 ? getPath({ to: ["<current_file>"] }) : deep(n - 1);

    // The default limit is 10 frames and the library spends several of them
    // reaching the resolver, so a caller this deep used to fall off the end.
    expect(deep(30)).toBe(THIS_FILE);
  });
});

describe("caller-relative aliases", () => {
  it("resolves <current_file> from an explicit `from`", () => {
    expect(getPath({ to: ["<current_file>"], from: import.meta.url })).toBe(
      THIS_FILE
    );
  });

  it("resolves <current_folder> and joins a subpath onto it", () => {
    expect(
      getPath({ to: ["<current_folder>", "fixtures"], from: import.meta.url })
    ).toBe(join(THIS_DIR, "fixtures"));
  });

  it("agrees with the stack fallback when both are available", () => {
    expect(getPath({ to: ["<current_folder>"], from: import.meta.url })).toBe(
      getPath({ to: ["<current_folder>"] })
    );
  });

  it("resolves relative to another module's location when given one", () => {
    const other = join(THIS_DIR, "fixtures", "consumer", "current-file.mjs");

    // The point of `from`: a helper can resolve paths on behalf of a module
    // that is nowhere on the current stack.
    expect(
      getPath({ to: ["<current_folder>"], from: pathToFileURL(other) })
    ).toBe(dirname(other));
  });
});
