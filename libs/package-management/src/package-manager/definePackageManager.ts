import type { Options as ShellOptions } from "execa";
import type { AsyncCacheFn as _AsyncCacheFn } from "async-cache-fn";
import type { AsyncCacheFn, __ } from "@/types";
import type { ImportMap, ResolvedImportMapPromise } from "@/module";
import type { PackageManagerId } from "./package-managers";
import type { DefinePackageFn } from "..";
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

export type PackageManagers = PackageManager<PackageManagerId>[];

export interface PackageManager<ID extends string = PackageManagerId> {
  id: ID;
  config: PackageManagerConfig;
  findLockfilePath: AsyncCacheFn<string | undefined, { cwd?: string }>;
  hasLockfile: AsyncCacheFn<boolean, { cwd?: string }>;
  readLockfile: AsyncCacheFn<string | undefined, { cwd?: string }>;
  globalVersion: AsyncCacheFn<string | undefined, PackageManagerScriptOptions>;

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

  const installPackage: PackageManager["installPackage"] = async (
    packageName,
    options
  ) => {
    const install = agentArgs.install;

    const { dev, preferOffline } = select(
      install.options,
      {
        preferOffline: true,

        cwd: defaultCwd,
        ...options,
      },
      "pick"
    );

    const packageNames = toArray(packageName);

    try {
      await $$({
        command,
        args: [install.command, dev, preferOffline, ...packageNames],
        cwd: defaultCwd,
        ...options,
      });
    } catch (e) {
      throw new Error(`Failed to install: ${packageNames.join(", ")}`);
    }
  };

  const uninstallPackage: PackageManager["uninstallPackage"] = async (
    packageName,
    options
  ) => {
    const uninstall = agentArgs.uninstall;

    await Promise.all(
      toArray(packageName).map(async (name) => {
        try {
          await $$({
            command,
            args: [uninstall.command, name],
            cwd: defaultCwd,
            ...options,
          });
        } catch (e) {}
      })
    );
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

    globalVersion: asyncCacheFn(async (...args) => {
      const [options] = args;

      try {
        const { stdout } = await $$({
          command,
          args: [agentOptions.version],
          cwd: defaultCwd,
          ...options,
        });

        return `${stdout}`;
      } catch (e) {
        return undefined;
      }
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
    stdio: silent ? "ignore" : "inherit",
  });
}
