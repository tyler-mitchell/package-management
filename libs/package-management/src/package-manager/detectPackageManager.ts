import type { SelectionMap } from "..";
import type { PackageManager, PackageManagers } from "./definePackageManager";
import type { PackageManagerId } from "./package-managers";
import { invariant, notFalsy } from "@/utils";

export interface DetectPackageManagerOptions {
  allowed?: SelectionMap<Record<PackageManagerId, unknown>>;
  cwd?: string;
}

export async function findPackageManager(
  packageManagers: PackageManagers,
  options?: DetectPackageManagerOptions
) {
  const { ...rest } = options ?? {};

  const packageManager = await findPackageManagerSafely(packageManagers, rest);

  invariant(packageManager, "No package manager found");

  return packageManager;
}

export async function findPackageManagerSafely<TAssert extends boolean = true>(
  packageManagers: PackageManagers,
  options?: DetectPackageManagerOptions & {
    assert?: TAssert;
  }
) {
  const lockfilePm = (
    await detectLockfilePackageManagers(packageManagers, options)
  )[0];

  if (lockfilePm) {
    return lockfilePm;
  }

  const globalPm = (
    await detectGlobalPackageManagers(packageManagers, options)
  )[0];

  return globalPm;
}

export async function detectPackageManagers(
  packageManagers: PackageManagers,
  options?: DetectPackageManagerOptions
) {
  return [
    ...(await detectLockfilePackageManagers(packageManagers, options)),
    ...(await detectGlobalPackageManagers(packageManagers, options)),
  ];
}

export async function detectLockfilePackageManagers(
  packageManagers: PackageManagers,
  options?: DetectPackageManagerOptions
) {
  return filterPackageManagers(
    packageManagers,
    (e) => e.hasLockfile(options),
    options
  );
}

export async function detectGlobalPackageManagers(
  packageManagers: PackageManagers,
  options?: DetectPackageManagerOptions
) {
  return filterPackageManagers(
    packageManagers,
    async (e) => Boolean(e.globalVersion(options)),
    options
  );
}

export async function filterPackageManagers(
  packageManagers: PackageManagers,
  filterFn: (packageManager: PackageManager) => Promise<boolean> | boolean,
  options?: DetectPackageManagerOptions
) {
  const allowedPackageManagers = packageManagers.filter(({ id }) => {
    if (!options?.allowed) return true;
    return id in options.allowed;
  });

  return (
    await Promise.all(
      allowedPackageManagers.map(async (pm) => {
        const valid = await filterFn(pm);

        return valid ? pm : undefined;
      })
    )
  ).filter(notFalsy);
}
