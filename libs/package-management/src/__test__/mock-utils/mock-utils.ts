import { findPackageManager } from "@/package-manager/detectPackageManager";
import { workspace } from "@/workspace";

export const mockPackages = definePackageNames(["lodash-es", "is-odd"]);

export function definePackageNames<const T extends string[]>(packages: T) {
  return {
    packageNames: packages,
    getPackageName: <P extends T[number]>(name: P) => name,
    getPackageNames: <P extends T[number][]>(names: P) => names,
    uninstall: async (name?: string) => {
      const toUninstall = name ? [name] : packages;
      const packageManager = await workspace
        .getProject("<package_folder>")
        .findPackageManager();
      await packageManager.uninstallPackage(toUninstall);
    },
  };
}
