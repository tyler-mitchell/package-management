import type { PackageName } from "@/project";
import type { PathOptions } from "..";
import { getWorkspacePackageInfoMap } from "./getWorkspacePackageInfoMap";

export function isPackageNameInWorkspace(
  name: PackageName | undefined,
  options?: PathOptions
) {
  if (!name) return false;
  const infoMap = getWorkspacePackageInfoMap(options);
  return Boolean(infoMap?.[name]);
}
