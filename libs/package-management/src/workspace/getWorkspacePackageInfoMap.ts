import type { PackageInfoMap } from "@/project";
import { getWorkspacePackageInfoList } from "./getWorkspacePackageInfoList";
import type { PathOptions } from "..";

export function getWorkspacePackageInfoMap(
  options?: PathOptions & { includeRoot?: boolean }
) {
  const workspaceInfo = getWorkspacePackageInfoList(options);

  const entries = workspaceInfo.map((info) => [info.name, info]);

  return Object.fromEntries(entries) as PackageInfoMap;
}
