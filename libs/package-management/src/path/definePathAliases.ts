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
  try {
    if (typeof options === "string" || Array.isArray(options)) {
      return resolvePathTo(options, { aliasMap });
    }

    const opts = { ...options, aliasMap };

    if (opts.startingFrom) {
      return resolveRelativePathTo(opts.to, opts.startingFrom, opts);
    }

    return resolvePathTo(opts.to, opts);
  } catch (e) {
    return undefined as any;
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
  if (Array.isArray(pathTo)) {
    const [baseDir] = pathTo;

    const aliasedPath = path.join(...pathTo.filter(isNotNull));

    return resolveAlias(aliasedPath, {
      [baseDir]: executeMapFn(aliasMap, baseDir, [{ cwd }]),
    });
  }

  return pathTo;
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
