import { existsSync } from "node:fs";
import path from "pathe";
import { resolveAlias } from "pathe/utils";
import { globbySync } from "globby";
import type { NoInfer, __ } from "@/types";

export interface AliasDefinition {
  resolve: ResolvePathAliasFn;
  subpaths?: Subpath[] | Readonly<Subpath[]>;
}

interface Subpath {
  to: string;
  description?: string;
}

export type AliasDefinitionMap<TAlias extends string = string> = Record<
  TAlias,
  AliasDefinition
>;

export type AliasMap<TAliases extends AliasDefinitionMap = AliasDefinitionMap> =
  {
    [K in keyof TAliases]: TAliases[K]["resolve"];
  } & {
    [K in keyof TAliases as `${Extract<K, string>}/${NonNullable<TAliases[K]["subpaths"]>[number]["to"]}`]: TAliases[K]["resolve"];
  };

type ResolvePathAliasFn = (opts?: { cwd?: string }) => string;

type StringKeyOf<T> = Extract<keyof T, string>;

export function definePathAliases<const T extends AliasDefinitionMap>(
  aliasDefinitions: T
) {
  type TAliasMap = AliasMap<T>;

  const aliasMap = getAliasMap(aliasDefinitions);

  function getFilePath<
    TValidate extends boolean = false,
    TGlob extends boolean = false,
  >(
    options:
      | PathTo<StringKeyOf<TAliasMap>>
      | GetPathOptions<StringKeyOf<TAliasMap>, TValidate, TGlob>,
    aliases?: Record<string, string>
  ) {
    return getAliasedFilePath<TAliasMap, TValidate, TGlob>(
      { ...aliasMap, ...aliases },
      options
    );
  }

  return {
    aliasDefinitions,
    aliasMap,
    getFilePath,
  };
}

export type PathTo<TBaseDirAlias extends string = string> =
  | string
  | [baseDir: TBaseDirAlias, subpath?: string];

export interface GetPathOptions<
  TAlias extends string,
  TValidate extends boolean = false,
  TGlob extends boolean = false,
> {
  to: PathTo<TAlias>;
  startingFrom?: PathTo<TAlias>;
  cwd?: string;
  checkExistence?: TValidate;
  glob?: TGlob;
}

function getAliasedFilePath<
  TAliasMap extends AliasMap,
  TValidate extends boolean,
  TGlob extends boolean,
>(
  aliasMap: TAliasMap,
  options:
    | PathTo<StringKeyOf<TAliasMap>>
    | GetPathOptions<StringKeyOf<TAliasMap>, TValidate, TGlob>
): TValidate extends true
  ? string | undefined
  : TGlob extends true
    ? string | undefined
    : string {
  const { to, startingFrom, cwd, checkExistence, glob } =
    typeof options === "string" || Array.isArray(options)
      ? ({ to: options } as GetPathOptions<
          StringKeyOf<TAliasMap>,
          TValidate,
          TGlob
        >)
      : options;

  const resolveOptions = { cwd, checkExistence, glob, aliasMap };

  try {
    return startingFrom
      ? resolveRelativePathTo(to, startingFrom, resolveOptions)
      : resolvePathTo(to, resolveOptions);
  } catch (error) {
    // `checkExistence` and `glob` are the only modes whose return type admits
    // `undefined`. Swallowing anything else reports a missing path as an empty
    // result and hands callers a `string` that is not one.
    if (checkExistence || glob) return undefined as never;
    throw error;
  }
}

function resolveRelativePathTo(
  to: PathTo,
  from: PathTo,
  options: ResolvePathToOptions
) {
  const pathFrom = resolvePathTo(from, options);
  const pathTo = resolvePathTo(to, options);
  return path.relative(pathFrom, pathTo);
}

interface ResolvePathToOptions {
  cwd?: string;
  checkExistence?: boolean;
  glob?: boolean;
  aliasMap?: AliasMap | undefined;
}

function resolvePathTo(
  pathTo: PathTo,
  { cwd, checkExistence, glob, aliasMap }: ResolvePathToOptions
) {
  const normalized = normalizePathTo(pathTo, { cwd, aliasMap });

  if (glob) {
    const globPaths = globbySync(normalized, { cwd });
    if (!globPaths[0])
      throw new Error(`No paths found for glob: ${normalized}`);

    return globPaths[0];
  }

  if (!glob && checkExistence && !existsSync(normalized))
    throw new Error(`Path does not exist: ${normalized}`);

  return normalized;
}

function normalizePathTo(
  pathTo: PathTo,
  options?: {
    cwd?: string;
    aliasMap?: AliasMap;
  }
) {
  const { cwd, aliasMap } = options ?? {};

  const aliasedPath = Array.isArray(pathTo)
    ? path.join(...pathTo.filter(isNotNull))
    : pathTo;

  // The tuple form names its alias positionally; the string form carries the
  // alias as a prefix (`"<package_folder>/src"`), so it has to be recovered.
  const baseDir = Array.isArray(pathTo)
    ? pathTo[0]
    : findAliasToken(aliasedPath, aliasMap);

  // A bare string that matches no alias is a literal path, not a broken alias.
  if (baseDir === undefined) return aliasedPath;

  const baseDirPath = executeMapFn(aliasMap, baseDir, [{ cwd }]);

  if (typeof baseDirPath !== "string" || baseDirPath.length === 0) {
    throw new Error(`Path alias resolved to no location: ${baseDir}`);
  }

  return resolveAlias(aliasedPath, { [baseDir]: baseDirPath });
}

/**
 * Recovers the alias a bare-string path is written against, so that
 * `"<package_folder>/src"` resolves the same way `["<package_folder>", "src"]`
 * does. Longest match wins, so a subpath alias such as
 * `"<package_folder>/node_modules"` is preferred over its parent.
 */
function findAliasToken(pathTo: string, aliasMap?: AliasMap) {
  return Object.keys(aliasMap ?? {})
    .filter((alias) => pathTo === alias || pathTo.startsWith(`${alias}/`))
    .sort((a, b) => b.length - a.length)[0];
}

function executeMapFn<
  TArgs extends any[],
  TMap extends Record<string, (...args: TArgs) => any>,
>(
  map: TMap | undefined,
  key: keyof NoInfer<TMap> | undefined,
  args: Parameters<NonNullable<TMap[keyof TMap]>> | undefined
) {
  if (!map || !key || !(key in map)) return undefined;

  const fnArgs = Array.isArray(args) ? args : [args];

  const resolver = map?.[key as keyof TMap];

  return typeof resolver === "function"
    ? resolver?.(...(fnArgs as any))
    : resolver;
}

export function getAliasMap<const T extends AliasDefinitionMap>(
  aliasDefs: T
): AliasMap<T> {
  return Object.fromEntries(
    Object.entries(aliasDefs).flatMap(([alias, v]) => {
      const { resolve, subpaths = [] } = v;
      return [
        [alias, resolve],
        ...subpaths.map(({ to }) => {
          const subpathAlias = path.join(alias, to);
          return [
            subpathAlias,
            (opts?: { cwd?: string }) =>
              resolveAlias(subpathAlias, { [alias]: resolve(opts) }),
          ];
        }),
      ];
    })
  );
}

function isNotNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
