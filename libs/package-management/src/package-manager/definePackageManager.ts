import type { AsyncCacheFn as _AsyncCacheFn } from "async-cache-fn";
import type {
  AsyncCacheFn,
  KeyOf,
  KeyOfValue,
  SelectionMap,
  __,
} from "@/types";
import { select, notFalsy, toArray, pathExists } from "@/utils";
import { asyncCacheFn } from "async-cache-fn";
import type { Options as ShellOptions } from "execa";
import { execa } from "execa";
import { findUp } from "find-up";
import { readFile } from "node:fs/promises";
import { Buffer } from "node:buffer";
import type { PackageManagerId } from "./package-managers";
import { isPackageExists } from "local-pkg";
import { isPackageDependency } from "..";
import type {
  PackageManagerCommandName,
  PackageManagerCommandSpec,
  PackageManagerConfig,
} from "./package-manager-types";

type ScriptOptions<
  K extends PackageManagerCommandName | undefined = undefined,
> = __<
  {
    cwd?: string;
    silent?: boolean;
    shellOptions?: ShellOptions;
  } & PackageManagerCommandSpec<K>
>;

export interface PackageManager<ID extends string = PackageManagerId> {
  id: ID;
  config: PackageManagerConfig;
  findLockfilePath: AsyncCacheFn<string | undefined, { cwd?: string }>;
  hasLockfile: AsyncCacheFn<boolean, { cwd?: string }>;
  readLockfile: AsyncCacheFn<string | undefined, { cwd?: string }>;
  globalVersion: AsyncCacheFn<string | undefined, ScriptOptions>;

  uninstallPackage: (
    packageNames: string | string[],
    options?: ScriptOptions<"uninstall">
  ) => Promise<void>;

  installPackage: (
    packageNames: string | string[],
    options?: ScriptOptions<"install">
  ) => Promise<void>;
}

export function definePackageManager<ID extends string>(
  config: PackageManagerConfig<ID>
): PackageManager<ID> {
  // ): PackageManager<ID> {
  const { command, args: agentArgs, options: agentOptions } = config;

  const findLockfilePath = asyncCacheFn(async (options?: { cwd?: string }) => {
    const { cwd } = options ?? {};
    const lockfiles = toArray(config.meta.lockfile);
    return await findUp(lockfiles, { cwd });
  });

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
          ...options,
        });

        return `${stdout}`;
      } catch (e) {
        return undefined;
      }
    }),

    installPackage: async (packageName, options) => {
      const install = agentArgs.install;

      const { isDevDependency, preferOffline } = select(
        install.options,
        options ?? {},
        "pick"
      );

      const packageNames = toArray(packageName);

      try {
        await $$({
          command,
          args: [
            install.command,
            isDevDependency,
            preferOffline,
            ...packageNames,
          ],
          ...options,
        });
      } catch (e) {
        throw new Error(`Failed to install: ${packageNames.join(", ")}`);
      }
    },

    uninstallPackage: async (packageName, options) => {
      const uninstall = agentArgs.uninstall;

      if (!isPackageDependency(packageName)) return;

      await $$({
        command,
        args: [uninstall.command, ...toArray(packageName)],
        ...options,
      }).catch((e) => {});
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
