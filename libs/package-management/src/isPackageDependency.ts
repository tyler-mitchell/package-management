import { toArray } from "@/utils";
import { isDependencyInPackageJson } from "@/project";

export function isPackageDependency(packageName: string | string[]) {
  return toArray(packageName).every((name) => isDependencyInPackageJson(name));
}
