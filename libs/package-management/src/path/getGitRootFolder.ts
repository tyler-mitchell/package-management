import { execaSync } from "execa";
import type { PathOptions } from "@/types";
import path from "pathe";
import process from "node:process";

export interface GetGitRootFolderOptions<$Validate extends boolean = true>
  extends PathOptions {
  /** @default true */
  throwIfNotFound?: $Validate;
}

/**
 * Starting from `cwd`, resolves the root of the enclosing git working tree.
 */
export function getGitRootFolder<$ThrowIfNotFound extends boolean = true>(
  options?: GetGitRootFolderOptions<$ThrowIfNotFound>
): $ThrowIfNotFound extends true ? string : string | undefined {
  const { cwd = process.cwd(), throwIfNotFound = true } = options ?? {};

  // `execaSync` takes the executable and its arguments separately; passing the
  // whole command as one string makes it look for a binary named `git rev-parse
  // --show-toplevel`, which fails on every platform.
  const { stdout } = execaSync("git", ["rev-parse", "--show-toplevel"], {
    cwd,
    reject: false,
  });

  if (!stdout) {
    if (throwIfNotFound) {
      throw new Error(`Directory "${cwd}" is not in a git repository`);
    }

    return undefined as never;
  }

  return path.normalize(stdout) as never;
}
