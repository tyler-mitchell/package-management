import type { PackageName } from "./project-types";
import { getWorkspacePackageInfoMap } from "../workspace/getWorkspacePackageInfoMap";

export function getProjectInfoByName(
  name: PackageName,
  options?: { cwd?: string }
) {
  const { cwd } = options ?? {};

  // The workspace root is itself a package, so a lookup by name has to be able
  // to find it — `getFolderByPackageName` already includes it, and disagreeing
  // here made the same name resolvable through one lookup and not the other.
  return getWorkspacePackageInfoMap({ cwd, includeRoot: true })[name];
}
