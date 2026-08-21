import { describe, it, expect } from "vitest";
import { execa } from "execa";
import path from "pathe";

/**
 * Exercises the built bundle the way a consumer does: a real ES module file,
 * imported by plain Node, resolving the aliases that depend on the caller's own
 * location.
 *
 * The unit tests cover frame parsing directly, but they run inside the test
 * runner, whose transform reports plain filesystem paths. A published consumer
 * receives `file://` URLs instead, so this is the only check that observes the
 * failure that actually reached consumers.
 *
 * Requires `pnpm build`, since the point is to test the artifact rather than
 * the sources.
 */
const fixture = path.join(
  __dirname,
  "fixtures",
  "consumer",
  "current-file.mjs"
);

describe("published artifact", () => {
  it("resolves caller-relative aliases from a consumer ES module", async () => {
    const { stdout } = await execa("node", [fixture]);

    const {
      currentFile,
      currentFolder,
      currentFolderSubpath,
      expectedFile,
      expectedFolder,
    } = JSON.parse(stdout);

    expect(currentFile).toBe(expectedFile);
    expect(currentFolder).toBe(expectedFolder);
    expect(currentFolderSubpath).toBe(expectedFile);
  });
});
