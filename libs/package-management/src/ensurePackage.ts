import type { InstallPackageOptions } from "@antfu/install-pkg";
import { installPackage } from "@antfu/install-pkg";
import { isPackageDependency } from "./isPackageDependency";

export async function ensurePackage(
  name: string | string[],
  options?: InstallPackageOptions
) {
  if (isPackageDependency(name)) return;

  await installPackage(name, options);
}
