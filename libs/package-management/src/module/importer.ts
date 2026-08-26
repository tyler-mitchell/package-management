import { isPackageDependency } from "..";
import { resolveModule } from "./module-utils";
import type { __ } from "@/types";
import type {
  ImportList,
  ImportOption,
  ImportPackageData,
  ResolvedImportOption,
  ResolvedImportList,
} from "./import-types";
import { workspace } from "@/workspace";

export interface ImporterOptions {
  /**
   * When enabled, the default behavior is to install packages that are not found if the name is provided.
   * @default true
   */
  install?: boolean;
  installer?: InstallerFn;
}

/**
 * Dynamically imports modules and returns their exports in a tuple.
 * This function ensures type safety and maintains the order of imports.
 *
 * @param imports An array of dynamic import promises.
 * @returns A promise that resolves to a tuple containing the default exports of the imported modules.
 *
 * @example
 * ```typescript
 * // Usage example with dynamic imports
 * const [package1, package2] = await importer([
 *   import('@antfu/eslint-config'),
 *   import('@antfu/install-pkg')
 * ]);
 *
 * // package1 and package2 will be the default exports of the respective modules
 * ```
 *
 * @typeparam Imports An array type representing the dynamic imports.
 */
export async function importer<T extends ImportList>(
  imports: [...T],
  options?: ImporterOptions
): Promise<ResolvedImportList<T>> {
  const { install: defaultInstall = true, installer } = options ?? {};

  const resolved = imports.map((option) => resolveImportOption(option));

  const missing = resolved.filter(
    (option) =>
      Boolean(option.name) &&
      (option.install ?? defaultInstall) &&
      !((option.checkExists ?? true) && isPackageDependency(option.name!))
  );

  // Installed in one batch per dependency kind, before any import runs.
  // Installing per import concurrently spawns a package manager process per
  // package against one node_modules, and their interleaved writes corrupt
  // the manager's own metadata — the same hazard `uninstallPackage` avoids.
  await installMissing(
    missing.filter(({ dev }) => !dev).map(({ name }) => name!),
    { dev: false },
    installer
  );

  await installMissing(
    missing.filter(({ dev }) => dev).map(({ name }) => name!),
    { dev: true },
    installer
  );

  return Promise.all(
    resolved.map(async (option) => resolveModule(await option.import()))
  ) as Promise<ResolvedImportList<T>>;
}

export type DefinePackageFn = <T = any>(
  options: __<string | Pick<ImportPackageData, "name" | "dev">>
) => ImportPackageData<T>;

export const definePackage: DefinePackageFn = (option) => {
  const { name, ...rest } =
    typeof option === "string" ? { name: option } : option;
  return {
    name,
    import: () => import(name) as any,
    ...rest,
  };
};

function resolveImportOption<T extends ImportOption>(
  option: T
): ResolvedImportOption<T> {
  if (typeof option === "function") {
    return {
      import: option as never,
    };
  }

  if (option instanceof Promise) {
    return {
      import: () => option as never,
    };
  }

  return option as never;
}

export type InstallerFn = (
  packageName: string | string[],
  options?: { dev?: boolean; checkExists?: boolean }
) => Promise<void>;

async function installMissing(
  packageNames: string[],
  options: Parameters<InstallerFn>[1],
  installer?: InstallerFn
) {
  if (packageNames.length === 0) return;

  const installerFn =
    installer ??
    (await workspace.getProject("<package_folder>").findPackageManager())
      .installPackage;

  await installerFn(packageNames, options);
}
