import { getWorkspacePackageInfoMap } from "@/workspace/getWorkspacePackageInfoMap";
import type { PathOptions } from "..";
import type { PackageName } from "../project";

export function getFolderByPackageName(
  name: PackageName,
  options?: PathOptions
) {
  const infoMap = getWorkspacePackageInfoMap({ ...options, includeRoot: true });
  const info = infoMap?.[name];
  return info?.dirpath;
}
