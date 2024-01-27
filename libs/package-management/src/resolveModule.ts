import type { Awaitable } from "@/types";

/**
 * Asynchronously handles the resolution of a module, extracting its default export if available.
 * If the module does not have a default export, it returns the module itself.
 *
 * @param m A promise representing a module import (either ES Module or CommonJS).
 * @returns A promise that resolves to either the default export of the module or the module itself.
 *
 * @typeparam T The type of the module being imported.
 *
 * @example
 * ```typescript
 * // Usage example with dynamic import
 * const module = await interopDefault(import('some-module'));
 *
 * // 'module' will be either the default export of 'some-module' or the module itself if no default export exists
 * ```
 */
export async function resolveModule<T>(
  m: Awaitable<T>
): Promise<T extends { default: infer U } ? U : T> {
  const resolved = await m;
  return (resolved as any).default || resolved;
}
