import { describe, expect, it, vi } from "vitest";
import { _filename } from "@/fs";

const THIS_FILE = __filename;

/**
 * `util.getCallSites` arrived in Node 22.9, inside the supported >=22 floor.
 * A named static import of it fails at module link time where it is absent,
 * which took the whole library down on those runtimes. The contract there:
 * everything loads, `from` — the documented exact path — works, and only the
 * stack fallback degrades to `undefined`.
 */
vi.mock("node:util", async (importOriginal) => {
  const util = await importOriginal<typeof import("node:util")>();
  const { getCallSites: _, ...withoutGetCallSites } = util;
  return { ...withoutGetCallSites, default: withoutGetCallSites };
});

describe("caller location without util.getCallSites", () => {
  it("loads and resolves an explicit `from`", () => {
    expect(_filename({ from: import.meta.url })).toBe(THIS_FILE);
  });

  it("degrades the stack fallback to undefined instead of crashing", () => {
    expect(_filename()).toBeUndefined();
  });
});
