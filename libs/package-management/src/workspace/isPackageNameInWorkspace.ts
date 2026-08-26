import type { PackageName } from "@/project";
import type { PathOptions } from "..";
import { getWorkspacePackageInfoMap } from "./getWorkspacePackageInfoMap";

export function isPackageNameInWorkspace(
  name: PackageName | undefined,
  options?: PathOptions
) {
  if (!name) return false;

  // Matches the other name-based lookups: the workspace root counts as being
  // in the workspace.
  const infoMap = getWorkspacePackageInfoMap({ ...options, includeRoot: true });

  return Boolean(infoMap?.[name]);
}
