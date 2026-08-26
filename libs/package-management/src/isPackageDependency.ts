import type { PathOptions } from "@/types";
import { toArray } from "@/utils";
import { isDependencyInPackageJson } from "@/project/findDependencyInPackageJson";
import { getPackageInfo } from "@/project/getPackageProjectInfo";

/**
 * Whether every named package is declared in the nearest package.json,
 * searching up from `cwd`.
 */
export function isPackageDependency(
  packageName: string | string[],
  options?: PathOptions
) {
  const { packageJson } = getPackageInfo(options);

  return toArray(packageName).every((name) =>
    isDependencyInPackageJson(name, packageJson)
  );
}
