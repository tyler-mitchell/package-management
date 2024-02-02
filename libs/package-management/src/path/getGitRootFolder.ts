import { $sync } from "@/utils";
import { execaSync } from "execa";
import type { PathOptions } from "@/types";
import path from "pathe";

export function getGitRootFolder(options?: PathOptions) {
  const output = $sync(`git rev-parse --show-toplevel`, {
    ...options,
    reject: false,
  });

  if (!output.stdout) {
    console.warn(`Directory "${output.cwd}" is not in a git repository`);
    return undefined;
  }

  return path.normalize(output.stdout);
}
