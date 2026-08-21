import { describe, expect, it } from "vitest";
import { getErrorStackFrames } from "@/fs/stack-frame";

/**
 * Builds an error carrying a hand-written stack so that frame parsing can be
 * exercised independently of the module system the test runner happens to use.
 *
 * This matters: under Vitest's transform, `StackFrame.fileName` arrives as a
 * plain filesystem path, which is the CommonJS shape. A consumer importing the
 * published ES module gets `file://` URLs instead, so a test that relies on its
 * own stack cannot observe the case that actually breaks in the wild.
 */
const errorWithStack = (frames: string[]) =>
  Object.assign(new Error(), { stack: ["Error", ...frames].join("\n") });

const framesOf = (error: Error, rootFunctionName: string) =>
  getErrorStackFrames(
    { error, rootFunctionName },
    (frame) => frame.isParentOfRootFunction
  );

describe("stack frame file paths", () => {
  it("converts a file:// url from an ES module frame into a filesystem path", () => {
    const error = errorWithStack([
      "    at getFilePath (file:///repo/node_modules/pkg/dist/index.mjs:803:12)",
      "    at file:///repo/src/nested/app.mjs:7:16",
    ]);

    const [frame] = framesOf(error, "getFilePath");

    expect(frame?.filePath).toBe("/repo/src/nested/app.mjs");
    expect(frame?.dirPath).toBe("/repo/src/nested");
  });

  it("leaves an already-plain path from a CommonJS frame untouched", () => {
    const error = errorWithStack([
      "    at getFilePath (/repo/node_modules/pkg/dist/index.cjs:803:12)",
      "    at Object.<anonymous> (/repo/src/nested/app.cjs:7:16)",
    ]);

    const [frame] = framesOf(error, "getFilePath");

    expect(frame?.filePath).toBe("/repo/src/nested/app.cjs");
    expect(frame?.dirPath).toBe("/repo/src/nested");
  });

  it("decodes percent-encoded segments in a file:// url", () => {
    const error = errorWithStack([
      "    at getFilePath (file:///repo/dist/index.mjs:803:12)",
      "    at file:///repo/src/my%20app/app.mjs:7:16",
    ]);

    const [frame] = framesOf(error, "getFilePath");

    expect(frame?.filePath).toBe("/repo/src/my app/app.mjs");
  });

  it("resolves the caller rather than the frame that requested it", () => {
    const error = errorWithStack([
      "    at _filename (file:///repo/dist/index.mjs:100:20)",
      "    at Object.resolve (file:///repo/dist/index.mjs:950:32)",
      "    at getFilePath (file:///repo/dist/index.mjs:803:12)",
      "    at file:///repo/src/caller.mjs:7:16",
    ]);

    const [frame] = framesOf(error, "getFilePath");

    expect(frame?.filePath).toBe("/repo/src/caller.mjs");
  });
});
