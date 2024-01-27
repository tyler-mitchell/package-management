import { ensurePackage } from ".";
import { resolveModule } from "./resolveModule";
import type {
  ImportList,
  ImportOption,
  ImportStatement,
  ResolvedImportList,
} from "@/types";

export interface ImporterOptions {
  /**
   * When enabled, the default behavior is to install packages that are not found.
   * The name of the package is inferred from the key of the import map.
   * @default true
   */
  install?: boolean;
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
  const { install = true } = options ?? {};
  return Promise.all(
    imports.map(async (option) => {
      if (install && "name" in option) {
        await ensurePackage(option.name);
      }

      const importStatement = getImportStatement(option);

      return resolveModule(importStatement);
    })
  ) as Promise<ResolvedImportList<T>>;
}

function getImportStatement<T>(option: ImportOption<T>): ImportStatement<T> {
  if (typeof option === "function") {
    return option();
  }
  if (typeof option === "object" && "import" in option && "name" in option) {
    return option.import();
  }
  return option;
}
