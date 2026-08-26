import type { Awaitable } from "@/types";
import type { ResolveOptions } from "mlly";
import { resolvePathSync } from "mlly";
import { normalizePath } from "@/utils";

export async function resolveModule<T>(
  module: Awaitable<T>
): Promise<T extends { default: infer U } ? U : T> {
  const resolved = await module;

  // Presence, not truthiness: `|| resolved` handed back the whole namespace for
  // a module whose default export is `0`, `""` or `false`, and threw outright
  // when the resolved value was null.
  const hasDefault =
    resolved !== null && typeof resolved === "object" && "default" in resolved;

  return (
    hasDefault ? (resolved as { default: unknown }).default : resolved
  ) as T extends { default: infer U } ? U : T;
}

export interface ResolveModulePathOptions extends Omit<ResolveOptions, "url"> {
  paths?: string | URL | (string | URL)[];
  normalize?: ((path: string) => string) | boolean;
}

export function isPackageModuleFound(
  name: string,
  options?: ResolveModulePathOptions
) {
  return Boolean(resolvePackageModulePath(name, options));
}

export function resolvePackageModulePath(
  name: string,
  options?: ResolveModulePathOptions
) {
  const resolvedPath = findResolvedModulePath(
    [`${name}/package.json`, name],
    options
  );

  if (resolvedPath === undefined) {
    console.error(`Could not resolve package ${name}`);
    return undefined;
  }

  return resolvedPath;
}

export function findResolvedModulePath(
  paths: string[],
  options?: ResolveModulePathOptions
) {
  for (const path of paths) {
    const resolvedPath = resolveModulePath(path, options);

    if (resolvedPath === undefined) continue;

    return resolvedPath;
  }
}

export function resolveModulePath(
  modulePath: string,
  options?: ResolveModulePathOptions
) {
  const { normalize = true, paths, ...rest } = options ?? {};
  try {
    const path = normalizePath(modulePath, normalize);

    return resolvePathSync(path, {
      url: paths,
      ...rest,
    });
  } catch (e) {
    return undefined;
  }
}
