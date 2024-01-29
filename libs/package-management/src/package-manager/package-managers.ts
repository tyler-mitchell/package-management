import type { PackageManager } from "./definePackageManager";
import { definePackageManager } from "./definePackageManager";
import { asyncCacheFn } from "async-cache-fn";
import type { DetectPackageManagerOptions } from "@/package-manager/detectPackageManager";
import bun from "./config/bun";
import npm from "./config/npm";
import pnpm from "./config/pnpm";
import yarn from "./config/yarn";
import {
  findPackageManager,
  findPackageManagerSafely,
  detectPackageManagers,
  detectLockfilePackageManagers,
  detectGlobalPackageManagers,
  filterPackageManagers,
} from "@/package-manager/detectPackageManager";

export type PackageManagerId = (typeof packageManagerConfigs)[number]["id"];

export const packageManagerConfigs = [pnpm, yarn, bun, npm];

export function definePackageManagerClient(
  options: DetectPackageManagerOptions
) {
  const configs = packageManagerConfigs.map((config) =>
    definePackageManager(config, options)
  );

  return {
    configs,

    findPackageManager: asyncCacheFn(
      async (options?: DetectPackageManagerOptions) =>
        await findPackageManager(configs, options)
    ),

    findPackageManagerSafely: asyncCacheFn(
      async (options?: DetectPackageManagerOptions) =>
        await findPackageManagerSafely(configs, options)
    ),

    detectPackageManagers: asyncCacheFn(
      async (options?: DetectPackageManagerOptions) =>
        await detectPackageManagers(configs, options)
    ),

    detectLockfilePackageManagers: asyncCacheFn(
      async (options?: DetectPackageManagerOptions) =>
        detectLockfilePackageManagers(configs, options)
    ),

    detectGlobalPackageManagers: asyncCacheFn(
      async (options?: DetectPackageManagerOptions) =>
        detectGlobalPackageManagers(configs, options)
    ),

    filterPackageManagers: async (
      filterFn: (packageManager: PackageManager) => Promise<boolean> | boolean,
      options?: DetectPackageManagerOptions
    ) => filterPackageManagers(configs, filterFn, options),
  };
}
