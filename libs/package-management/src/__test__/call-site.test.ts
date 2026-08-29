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

  it("falls back to script ownership when the boundary name is absent", () => {
    // This is the minified case made deterministic: a minifier renames the
    // entry function, so the name lookup finds nothing and resolution has to
    // fall through to "first frame from a script we do not own".
    expect(
      _filename({ boundaryFunctionName: "a-name-no-frame-will-ever-have" })
    ).toBe(THIS_FILE);
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

describe("`from` rejects anything that does not name a module", () => {
  // A specifier that is not a file leaked through as though it were a path:
  // "http://host/x.js" became "http:/host/x.js" and then served as a base
  // directory for anything joined onto it.
  it.each([
    ["an http url", "http://evil.example/x.js"],
    ["a data url", "data:text/javascript,export{}"],
    ["a node: builtin", "node:fs"],
    ["a bare string", "not a url at all"],
    ["a relative path", "./local.js"],
  ])("rejects %s", (_label, from) => {
    expect(() => _filename({ from })).toThrow(
      /must be a file: URL or an absolute path/
    );
  });

  it("does not let a rejected `from` become a base directory", () => {
    expect(() =>
      getPath({
        to: ["<current_folder>", "config"],
        from: "http://evil.example/x.js",
      })
    ).toThrow(/must be a file: URL or an absolute path/);
  });

  it("accepts an absolute path", () => {
    expect(_filename({ from: "/tmp/real.js" })).toBe("/tmp/real.js");
  });

  it("decodes percent-encoded segments", () => {
    expect(_filename({ from: "file:///tmp/a%20b/c.js" })).toBe("/tmp/a b/c.js");
  });

  it("drops a query and hash, which bundlers append to module urls", () => {
    expect(_filename({ from: "file:///tmp/a.js?v=1#frag" })).toBe("/tmp/a.js");
  });
});

describe("hostile and unusual call contexts", () => {
  const currentFile = () => getPath({ to: ["<current_file>"] });

  it("survives a host replacing Error.prepareStackTrace", () => {
    // Sentry, source-map-support and friends do this process-wide. Parsing
    // error.stack is at their mercy; getCallSites is not.
    const original = Error.prepareStackTrace;
    Error.prepareStackTrace = () => "REPLACED";

    try {
      expect(currentFile()).toBe(THIS_FILE);
    } finally {
      Error.prepareStackTrace = original;
    }
  });

  it("is not confused by a caller with its own getFilePath", () => {
    // Frames run innermost first, so the library's own entry is found before
    // a same-named function further out.
    function getFilePath() {
      return currentFile();
    }

    expect(getFilePath()).toBe(THIS_FILE);
  });

  it("resolves after an await, where the synchronous stack is gone", async () => {
    await null;

    expect(currentFile()).toBe(THIS_FILE);
  });

  it("resolves inside a timer callback", async () => {
    const resolved = await new Promise<string | undefined>((resolve) =>
      setTimeout(() => resolve(currentFile()), 0)
    );

    expect(resolved).toBe(THIS_FILE);
  });

  it("resolves inside a callback invoked by a built-in", () => {
    expect([1].map(() => currentFile())[0]).toBe(THIS_FILE);
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
