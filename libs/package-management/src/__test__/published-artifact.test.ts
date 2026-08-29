import { afterAll, describe, expect, it } from "vitest";
import { execa } from "execa";
import { build } from "esbuild";
import { readFileSync, rmSync } from "node:fs";
import path from "pathe";

/**
 * Exercises the built bundle the way a consumer does: a real ES module file,
 * imported by plain Node, resolving the aliases that depend on the caller's own
 * location.
 *
 * The unit tests cover caller resolution directly, but they run inside the test
 * runner, whose transform reports plain filesystem paths. A published consumer
 * receives `file://` URLs instead, so this is the only check that observes the
 * failure that actually reached consumers.
 *
 * Requires `pnpm build`, since the point is to test the artifact rather than
 * the sources.
 */
const distDir = path.join(__dirname, "..", "..", "dist");

const bundle = path.join(distDir, "index.mjs");

const minifiedBundle = path.join(distDir, "index.min.mjs");

const fixture = path.join(
  __dirname,
  "fixtures",
  "consumer",
  "current-file.mjs"
);

async function runConsumer(target?: string) {
  const { stdout } = await execa(
    "node",
    target ? [fixture, target] : [fixture]
  );

  return JSON.parse(stdout);
}

function expectResolvesToItself(result: Record<string, string>) {
  const {
    currentFile,
    currentFolder,
    currentFolderSubpath,
    currentFileFrom,
    currentFolderFrom,
    expectedFile,
    expectedFolder,
  } = result;

  expect(currentFile).toBe(expectedFile);
  expect(currentFolder).toBe(expectedFolder);
  expect(currentFolderSubpath).toBe(expectedFile);

  // Both routes agree: the caller naming itself, and the stack fallback
  // reading it.
  expect(currentFileFrom).toBe(expectedFile);
  expect(currentFolderFrom).toBe(expectedFolder);
}

afterAll(() => {
  rmSync(minifiedBundle, { force: true });
});

describe("published artifact", () => {
  it("resolves caller-relative aliases from a consumer ES module", async () => {
    expectResolvesToItself(await runConsumer());
  });

  it("still resolves them after minification", async () => {
    // The stack fallback finds the library's entry point by function name,
    // which a minifier renames. It then falls back to the first frame from a
    // script the library does not own — and a bundle is one script, so that
    // holds without any symbol name surviving. This is the test for that
    // claim; without the fallback the name lookup misses and resolution walks
    // into the library's own frames.
    await build({
      entryPoints: [bundle],
      outfile: minifiedBundle,
      bundle: true,
      minify: true,
      format: "esm",
      platform: "node",
      packages: "external",
    });

    // The precondition: no named `getFilePath` declaration survives, so no
    // frame reports that name. The identifier still appears as a property key
    // and as the boundary string, neither of which affects frame names.
    expect(readFileSync(minifiedBundle, "utf-8")).not.toMatch(
      /function\s+getFilePath\b/
    );

    expectResolvesToItself(await runConsumer(minifiedBundle));
  });
});
