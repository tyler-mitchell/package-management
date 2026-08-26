import { describe, expect, it } from "vitest";
import {
  buildSingleProp,
  checkResult,
  defaults,
  entriesOf,
  fromEntries,
  getArrayItemAtOffset,
  invariant,
  isMatching,
  isVersionNumber,
  normalizePath,
  notFalsy,
  pathExists,
  select,
  toArray,
} from "./utils";

describe("toArray", () => {
  it("wraps a lone value and passes an array through", () => {
    expect(toArray("one")).toEqual(["one"]);
    expect(toArray(["one", "two"])).toEqual(["one", "two"]);
  });
});

describe("entriesOf / fromEntries", () => {
  it("round-trips an object", () => {
    const entries = entriesOf({ a: 1, b: 2 });

    expect(fromEntries(entries)).toEqual({ a: 1, b: 2 });
  });
});

describe("notFalsy", () => {
  it("rejects only false, null and undefined", () => {
    expect([0, "", false, null, undefined, "kept"].filter(notFalsy)).toEqual([
      0,
      "",
      "kept",
    ]);
  });
});

describe("select", () => {
  it("picks the keys marked true", () => {
    expect(select({ a: "A", b: "B" }, { a: true })).toEqual({ a: "A" });
  });

  it("omits the keys marked true in omit mode", () => {
    expect(select({ a: "A", b: "B" }, { a: true }, "true:omit")).toEqual({
      b: "B",
    });
  });

  it("returns the object unchanged without a selection", () => {
    expect(select({ a: "A" })).toEqual({ a: "A" });
  });
});

describe("defaults", () => {
  it("fills in absent keys", () => {
    expect(defaults({ a: 1 }, { b: 2 } as never)).toEqual({ a: 1, b: 2 });
  });

  it("keeps the default when a key is explicitly undefined", () => {
    // The return type promises the default is present, so an explicit
    // `undefined` cannot be allowed to overwrite it.
    expect(defaults({ a: undefined }, { a: 1 } as never)).toEqual({ a: 1 });
  });

  it("accepts an absent object", () => {
    expect(defaults(undefined, { a: 1 } as never)).toEqual({ a: 1 });
  });
});

describe("pathExists", () => {
  it("resolves true for a real path and false otherwise", async () => {
    await expect(pathExists(import.meta.filename)).resolves.toBe(true);
    await expect(pathExists("/definitely/not/here")).resolves.toBe(false);
  });
});

describe("normalizePath", () => {
  it("normalizes by default", () => {
    expect(normalizePath("a//b")).toBe("a/b");
  });

  it("leaves the path alone when disabled", () => {
    expect(normalizePath("a//b", false)).toBe("a//b");
  });

  it("applies a supplied normalizer", () => {
    expect(normalizePath("a//b", (path) => `custom:${path}`)).toBe(
      "custom:a//b"
    );
  });
});

describe("isVersionNumber", () => {
  it("accepts a plain semver triple and rejects anything else", () => {
    expect(isVersionNumber("1.2.3")).toBe(true);
    expect(isVersionNumber("1.2")).toBe(false);
    expect(isVersionNumber("v1.2.3")).toBe(false);
  });
});

describe("invariant", () => {
  it("throws the given message on a falsy value", () => {
    expect(() => invariant(false, "must hold")).toThrowError("must hold");
    expect(() => invariant(true, "must hold")).not.toThrow();
  });
});

describe("getArrayItemAtOffset", () => {
  it("reads relative to an index, including index zero", () => {
    const items = ["a", "b", "c"];

    expect(getArrayItemAtOffset(items, 1, -1)).toBe("a");
    expect(getArrayItemAtOffset(items, 0, 1)).toBe("b");
    expect(getArrayItemAtOffset(items, 0)).toBe("a");
  });

  it("returns undefined without an array or index", () => {
    expect(getArrayItemAtOffset(undefined, 0)).toBeUndefined();
    expect(getArrayItemAtOffset(["a"], undefined)).toBeUndefined();
  });
});

describe("isMatching", () => {
  it("matches equal strings, including empty ones", () => {
    expect(isMatching("a", "a")).toBe(true);
    expect(isMatching("", "")).toBe(true);
    expect(isMatching("a", "b")).toBe(false);
    expect(isMatching(undefined, undefined)).toBe(false);
  });
});

describe("checkResult", () => {
  it("reports a value under data and a throw under error", () => {
    expect(checkResult(() => "value")).toEqual({ data: "value" });

    const { error } = checkResult(() => {
      throw new Error("boom");
    });

    expect(error).toBeInstanceOf(Error);
  });

  it("honours custom result keys", () => {
    expect(checkResult(() => 1, { keys: { data: "ok" } })).toEqual({ ok: 1 });
  });
});

describe("buildSingleProp", () => {
  it("builds from an object or a tuple", () => {
    expect(buildSingleProp({ key: "a", value: 1 })).toEqual({ a: 1 });
    expect(buildSingleProp(["b", 2])).toEqual({ b: 2 });
  });
});
