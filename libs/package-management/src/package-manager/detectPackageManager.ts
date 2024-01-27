import type { SelectionMap } from "..";
import type { PackageManager } from "./definePackageManager";
import type { PackageManagerId } from "./package-managers";
import { packageManagers } from "./package-managers";
import { invariant, notFalsy } from "@/utils";

interface DetectPackageManagerOptions {
  allowed?: SelectionMap<typeof packageManagers>;
  cwd?: string;
}

export async function findPackageManager(
  options?: DetectPackageManagerOptions
) {
  const { ...rest } = options ?? {};

  const packageManager = await findPackageManagerSafely(rest);

  invariant(packageManager, "No package manager found");

  return packageManager;
}

export async function findPackageManagerSafely<TAssert extends boolean = true>(
  options?: DetectPackageManagerOptions & {
    assert?: TAssert;
  }
) {
  const lockfilePm = (await detectLockfilePackageManagers(options))[0];

  if (lockfilePm) {
    return lockfilePm;
  }

  const globalPm = (await detectGlobalPackageManagers(options))[0];

  return globalPm;
}

export async function detectPackageManagers(
  options?: DetectPackageManagerOptions
) {
  return [
    ...(await detectLockfilePackageManagers(options)),
    ...(await detectGlobalPackageManagers(options)),
  ];
}

export async function detectLockfilePackageManagers(
  options?: DetectPackageManagerOptions
) {
  const opts = { cwd: options?.cwd };
  return filterPackageManagers((e) => e.hasLockfile(options), options);
}

export async function detectGlobalPackageManagers(
  options?: DetectPackageManagerOptions
) {
  return filterPackageManagers(async (e) => e.globalVersion(options), options);
}

export async function filterPackageManagers(
  filterFn: (packageManager: PackageManager) => Promise<unknown>,
  options?: DetectPackageManagerOptions
) {
  const allowedPackageManagers = Object.entries(packageManagers).filter(
    ([key]) => {
      if (!options?.allowed) return true;
      return key in options.allowed;
    }
  );

  return (
    await Promise.all(
      allowedPackageManagers.map(async ([key, pm]) => {
        const valid = await filterFn(pm);

        return valid ? pm : undefined;
      })
    )
  ).filter(notFalsy);
}
