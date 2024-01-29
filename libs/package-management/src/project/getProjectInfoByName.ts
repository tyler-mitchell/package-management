import type { PackageName } from "./project-types";
import { getWorkspacePackageInfoMap } from "../workspace/getWorkspacePackageInfoMap";

export function getProjectInfoByName(
  name: PackageName,
  options?: { cwd?: string }
) {
  const { cwd } = options ?? {};
  return getWorkspacePackageInfoMap({ cwd })[name];
}
