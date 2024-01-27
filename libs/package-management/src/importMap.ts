import type { ImportMap, ResolvedImportMap } from "@/types";
import type { ImporterOptions } from "./importer";
import { importer } from "./importer";

/**
 * Asynchronously imports modules from a record of dynamic import promises.
 * Returns a promise that resolves to a record with the same keys, each mapped to the resolved import.
 * This function maintains the key-value mapping and ensures type safety.
 *
 * @param importMap A record where each key is associated with a dynamic import promise.
 * @returns A promise that resolves to a record containing the default exports of the imported modules,
 *          maintaining the original key structure.
 *
 * @example
 * ```typescript
 * // Usage example with a record of dynamic imports
 *
 * const { package1, package2 } = await importMap({
 *   package1: import('package-1'),
 *   package2: import('package-2')
 * });
 *
 * // importedModules.config and importedModules.pkg will be the default exports of the respective modules
 * ```
 *
 */
export async function importMap<T extends ImportMap>(
  importMap: T,
  options?: ImporterOptions
): Promise<ResolvedImportMap<T>> {
  const keys = Object.keys(importMap) as Array<keyof T>;

  const imported = await importer(
    keys.map((key) => importMap[key]) as Promise<any>[],
    options
  );

  return Object.fromEntries(
    keys.map((key, index) => [key, imported[index]])
  ) as Promise<ResolvedImportMap<T>>;
}
