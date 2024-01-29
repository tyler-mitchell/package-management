import type { GetPackageInfoListOptions } from "./getWorkspacePackageInfoList";
import { getWorkspacePackageInfoList } from "./getWorkspacePackageInfoList";

export function getWorkspacePackageNames(options?: GetPackageInfoListOptions) {
  return getWorkspacePackageInfoList(options).map((e) => e.name);
}
