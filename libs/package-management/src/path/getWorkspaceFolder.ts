import type { PathOptions } from "@/types";
import * as WST from "workspace-tools";
import process from "node:process";

export interface GetWorkspaceFolderOptions<$Validate extends boolean = true>
  extends PathOptions {
  /** @default true */
  fallbackToGitRoot?: boolean;
  /** @default true */
  throwIfNotFound?: $Validate;
}

/**
 * Starting from cwd, searches up the directory hierarchy for the workspace root,
 * falling back to the git root if no workspace is detected.
 */
export function getWorkspaceFolder<$ThrowIfNotFound extends boolean = true>(
  options?: GetWorkspaceFolderOptions<$ThrowIfNotFound>
): $ThrowIfNotFound extends true ? string : string | undefined {
  const {
    cwd = process.cwd(),
    fallbackToGitRoot = true,
    throwIfNotFound = true,
  } = options ?? {};

  const getFolder = fallbackToGitRoot
    ? WST.getWorkspaceRoot
    : WST.getWorkspaceRoot;

  const folder = getFolder(cwd);

  if (folder === undefined && throwIfNotFound) {
    throw new Error(`Could not find workspace folder`);
  }

  return folder!;
}

const a = getWorkspaceFolder();
