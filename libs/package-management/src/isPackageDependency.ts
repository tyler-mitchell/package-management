import { toArray } from "@/utils";
import { isPackageExists } from "local-pkg";

export function isPackageDependency(packageName: string | string[]) {
  return toArray(packageName).every((name) => isPackageExists(name));
}
