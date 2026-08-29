import * as WST from "workspace-tools";
import process from "node:process";

/**
 *
 * Finds the nearest `package.json` directory, starting from `cwd`
 *
 */
export function getPackageFolder(options?: { cwd?: string }) {
  // No `!`: there is genuinely no package root when nothing up-chain has a
  // package.json, and asserting it away let `undefined` reach `path.join`,
  // which produced paths rooted at `/`.
  return WST.findPackageRoot(options?.cwd ?? process.cwd());
}
