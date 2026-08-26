import type { Options as ShellOptions } from "execa";
import type { AsyncCacheFn as _AsyncCacheFn } from "async-cache-fn";
import type { AsyncCacheFn, __ } from "@/types";
import type { ImportMap, ResolvedImportMapPromise } from "@/module";
import type { PackageManagerId } from "./package-managers";
import type { DefinePackageFn } from "@/module/importer";
import type {
  PackageManagerConfig,
  PackageManagerScriptOptions,
  UninstallPackageOptions,
} from "./package-manager-types";
import { select, notFalsy, toArray } from "@/utils";
import { asyncCacheFn } from "async-cache-fn";
import { execa } from "execa";
import { findUp } from "find-up";
import { readFile } from "node:fs/promises";
import { definePackage } from "..";
import { importMap } from "@/module/importMap";
import { getPackageInfo } from "@/project/getPackageProjectInfo";
import { isDependencyInPackageJson } from "@/project/findDependencyInPackageJson";

/**
 * A set of package managers. Generic over the id so that managers built with
 * `definePackageManager` from a custom config are accepted everywhere the
 * built-in ones are, without a cast.
 */
export type PackageManagers<$id extends string = PackageManagerId> =
  PackageManager<$id>[];

export interface PackageManager<ID extends string = PackageManagerId> {
  id: ID;
  config: PackageManagerConfig;
  findLockfilePath: AsyncCacheFn<string | undefined, { cwd?: string }>;
  hasLockfile: AsyncCacheFn<boolean, { cwd?: string }>;
  readLockfile: AsyncCacheFn<string | undefined, { cwd?: string }>;
  globalVersion: AsyncCacheFn<string | undefined, PackageManagerScriptOptions>;

  /**
   * Whether the installed version is the one this config describes. Always
   * true for managers whose lockfile already identifies them unambiguously.
   */
  matchesVersion: AsyncCacheFn<boolean, PackageManagerScriptOptions>;

  definePackage: DefinePackageFn;

  defineImportMap: <T extends ImportMap>(
    importMap: T,
    options?: {
      /**
       * When enabled, the default behavior is to install packages that are not found.
       * @default true
       */
      install?: boolean;
    }
  ) => ResolvedImportMapPromise<T>;

  uninstallPackage: (
    packageNames: string | string[],
    options?: UninstallPackageOptions
  ) => Promise<void>;

  installPackage: (
    packageNames: string | string[],
    options?: PackageManagerScriptOptions<"install">
  ) => Promise<void>;
}

export function definePackageManager<ID extends string>(
  config: PackageManagerConfig<ID>,
  options?: {
    cwd?: string;
  }
): PackageManager<ID> {
  const { cwd: defaultCwd } = options ?? {};
  const { command, args: agentArgs, options: agentOptions } = config;

  const findLockfilePath = asyncCacheFn(async (options?: { cwd?: string }) => {
    const { cwd = defaultCwd } = options ?? {};
    const lockfiles = toArray(config.meta.lockfile);
    return await findUp(lockfiles, { cwd });
  });

  const globalVersion = asyncCacheFn(
    async (options?: PackageManagerScriptOptions) => {
      try {
        const { stdout } = await $$({
          command,
          args: [agentOptions.version],
          cwd: defaultCwd,
          ...options,
        });

        return `${stdout}`.trim();
      } catch {
        return undefined;
      }
    }
  );

  const installPackage: PackageManager["installPackage"] = async (
    packageName,
    options
  ) => {
    const install = agentArgs.install;

    // @ts-expect-error
    const { dev, preferOffline } = select(
      install.options,
      {
        preferOffline: true,
        cwd: defaultCwd,
        ...options,
      },
      "true:pick"
    );

    const packageNames = toArray(packageName);

    try {
      await $$({
        command,
        args: [install.command, dev, preferOffline, ...packageNames],
        cwd: defaultCwd,
        ...options,
      });
    } catch (error) {
      throw new Error(`Failed to install: ${packageNames.join(", ")}`, {
        cause: error,
      });
    }
  };

  const uninstallPackage: PackageManager["uninstallPackage"] = async (
    packageName,
    options
  ) => {
    const uninstall = agentArgs.uninstall;

    const cwd = options?.cwd ?? defaultCwd;

    const { packageJson } = getPackageInfo({ cwd });

    // Removing something that was never installed is a no-op, not a failure —
    // but package managers exit non-zero for it. Narrowing to what is actually
    // declared keeps the operation idempotent without a blanket `catch`, which
    // would also swallow genuine failures.
    const installed = toArray(packageName).filter((name) =>
      isDependencyInPackageJson(name, packageJson)
    );

    if (installed.length === 0) return;

    // One invocation for the whole set, matching `installPackage`. Running the
    // manager once per name spawns concurrent processes against the same
    // `node_modules`, and their interleaved writes corrupt its own metadata.
    try {
      await $$({
        command,
        args: [uninstall.command, ...installed],
        cwd,
        ...options,
      });
    } catch (error) {
      throw new Error(`Failed to uninstall: ${installed.join(", ")}`, {
        cause: error,
      });
    }
  };

  return {
    id: config.id,
    config,
    findLockfilePath,

    hasLockfile: asyncCacheFn(async (...args) => {
      const lockfilePath = await findLockfilePath.noCache(...args);
      return Boolean(lockfilePath);
    }),

    readLockfile: asyncCacheFn(async (...args) => {
      const lockfilePath = await findLockfilePath.noCache(...args);

      if (!lockfilePath) return undefined;

      return readFile(lockfilePath, "utf8");
    }),

    globalVersion,

    matchesVersion: asyncCacheFn(async (...args) => {
      const { matchesVersion } = config.meta;

      // No predicate means the lockfile already identifies this manager.
      if (!matchesVersion) return true;

      const version = await globalVersion.noCache(...args);

      return version ? matchesVersion(version) : false;
    }),

    definePackage,

    installPackage,

    uninstallPackage,

    defineImportMap(imports, options) {
      const { install = true } = options ?? {};
      return importMap(imports, {
        install,
        installer: installPackage,
      });
    },
  };
}

async function $$(options: {
  command: string;
  args?: readonly (string | undefined | false)[];
  silent?: boolean;
  cwd?: string;
  shellOptions?: ShellOptions;
}) {
  const { command, args = [], silent = true, cwd, shellOptions } = options;

  return execa(command, args.filter(notFalsy), {
    cwd,
    ...shellOptions,
    // `pipe` keeps output off the console while still capturing it: a failed
    // command can report why it failed, and `globalVersion` can read stdout.
    // `ignore` discards the reason along with the output.
    stdio: silent ? "pipe" : "inherit",
  });
}
