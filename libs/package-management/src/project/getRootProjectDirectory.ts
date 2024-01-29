import type { PathOptions } from "@/types";
import * as WST from "workspace-tools";
import process from "node:process";

/**
 * Starting from cwd, searches up the directory hierarchy for the workspace root,
 * falling back to the git root if no workspace is detected.
 */
export function getRootDirectory(options?: PathOptions) {
  return WST.findProjectRoot(options?.cwd ?? process.cwd())!;
}
