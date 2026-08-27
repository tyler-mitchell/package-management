import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPath } from "../../../../dist/index.mjs";

/**
 * Resolves the caller-relative aliases from a real ES module importing the
 * built bundle, and reports both what was resolved and what it should be.
 *
 * This runs under plain Node rather than the test runner on purpose: Vitest's
 * transform reports stack frames as plain filesystem paths, while a consumer
 * importing the published ES module gets `file://` URLs. Only the latter
 * exercises the conversion these aliases depend on.
 */
const thisFile = fileURLToPath(import.meta.url);

const from = import.meta.url;

process.stdout.write(
  JSON.stringify({
    currentFile: getPath({ to: ["<current_file>"] }),
    currentFolder: getPath({ to: ["<current_folder>"] }),
    currentFolderSubpath: getPath({ to: ["<current_folder>", "current-file.mjs"] }),
    // The same answers with the caller naming itself, which is what a consumer
    // should prefer — it does not depend on the stack at all.
    currentFileFrom: getPath({ to: ["<current_file>"], from }),
    currentFolderFrom: getPath({ to: ["<current_folder>"], from }),
    expectedFile: thisFile,
    expectedFolder: path.dirname(thisFile),
  })
);
