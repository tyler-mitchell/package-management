import * as WST from "workspace-tools";
import process from "node:process";

/**
 *
 * Finds the nearest `package.json` directory, starting from `cwd`
 *
 */
export function getPackageDirectory(options?: { cwd?: string }) {
  return WST.findPackageRoot(options?.cwd ?? process.cwd())!;
}
