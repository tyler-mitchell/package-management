import { findPackageManager, isPackageDependency } from "..";
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
export function importer<T extends ImportList>(
  imports: [...T],
  options?: ImporterOptions
): Promise<ResolvedImportList<T>> {
  const { install: defaultInstall = true, installer } = options ?? {};
  return Promise.all(
    imports.map(async (e) => {
      const importOpt = resolveImportOption(e);

      const shouldInstall = importOpt.install ?? defaultInstall;

      if (shouldInstall && importOpt.name) {
        await installImport(importOpt.name, importOpt, installer);
      }

      const m = await importOpt.import();

      return resolveModule(m);
    })
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

async function installImport(
  packageName: string | string[],
  options?: Parameters<InstallerFn>[1],
  installer?: InstallerFn
) {
  if (!packageName) return;

  const { checkExists } = options ?? {};

  if (checkExists && isPackageDependency(packageName)) return;

  const installerFn =
    installer ??
    (await workspace.getProject("@package").findPackageManager())
      .installPackage;

  await installerFn(packageName, options);
}
