import type { SelectionMap } from "..";
import type { PackageManager, PackageManagers } from "./definePackageManager";
import type { PackageManagerId } from "./package-managers";
import type { Awaitable } from "@/types";
import { invariant, notFalsy } from "@/utils";

export interface DetectPackageManagerOptions<
  $id extends string = PackageManagerId,
> {
  /**
   * Restricts detection to the given package managers. Omit to consider all of
   * them.
   */
  allowed?: SelectionMap<Record<$id, unknown>>;
  cwd?: string;
}

/**
 * The package manager a project uses, preferring the one whose lockfile is
 * present and falling back to whichever is installed globally.
 *
 * @throws when no package manager can be resolved.
 */
export async function findPackageManager<$id extends string = PackageManagerId>(
  packageManagers: PackageManagers<$id>,
  options?: DetectPackageManagerOptions<$id>
) {
  const packageManager = await findPackageManagerSafely(
    packageManagers,
    options
  );

  invariant(packageManager, "No package manager found");

  return packageManager;
}

/**
 * As {@link findPackageManager}, but resolves to `undefined` rather than
 * throwing when nothing matches.
 */
export async function findPackageManagerSafely<
  $id extends string = PackageManagerId,
>(
  packageManagers: PackageManagers<$id>,
  options?: DetectPackageManagerOptions<$id>
) {
  const [fromLockfile] = await detectLockfilePackageManagers(
    packageManagers,
    options
  );

  if (fromLockfile) return fromLockfile;

  const [fromGlobal] = await detectGlobalPackageManagers(
    packageManagers,
    options
  );

  return fromGlobal;
}

export async function detectPackageManagers<
  $id extends string = PackageManagerId,
>(
  packageManagers: PackageManagers<$id>,
  options?: DetectPackageManagerOptions<$id>
) {
  return [
    ...(await detectLockfilePackageManagers(packageManagers, options)),
    ...(await detectGlobalPackageManagers(packageManagers, options)),
  ];
}

export async function detectLockfilePackageManagers<
  $id extends string = PackageManagerId,
>(
  packageManagers: PackageManagers<$id>,
  options?: DetectPackageManagerOptions<$id>
) {
  return filterPackageManagers(
    packageManagers,
    // Yarn Classic and Berry share a lockfile name, so a lockfile match alone
    // would report both. The version check settles which one it is.
    async (packageManager) =>
      (await packageManager.hasLockfile(options)) &&
      (await packageManager.matchesVersion(options)),
    options
  );
}

export async function detectGlobalPackageManagers<
  $id extends string = PackageManagerId,
>(
  packageManagers: PackageManagers<$id>,
  options?: DetectPackageManagerOptions<$id>
) {
  return filterPackageManagers(
    packageManagers,
    // Without the `await`, `Boolean` receives a pending promise and is always
    // `true`, so every package manager passes the filter regardless of whether
    // it is actually installed.
    async (packageManager) =>
      Boolean(await packageManager.globalVersion(options)) &&
      (await packageManager.matchesVersion(options)),
    options
  );
}

/**
 * Global versions of every allowed package manager, keyed by id, where
 * `undefined` means the manager is not installed.
 *
 * Reading one version per manager is inherently concurrent; resolving that
 * concurrency here is what keeps callers from assembling their own
 * `Promise.all` over {@link PackageManager.globalVersion}.
 */
export async function getGlobalVersions<$id extends string = PackageManagerId>(
  packageManagers: PackageManagers<$id>,
  options?: DetectPackageManagerOptions<$id>
) {
  const entries = await mapPackageManagers(
    packageManagers,
    async (packageManager) =>
      [packageManager.id, await packageManager.globalVersion(options)] as const,
    options
  );

  return Object.fromEntries(entries) as Record<$id, string | undefined>;
}

/**
 * Applies `mapFn` to every allowed package manager concurrently — the
 * collection-level counterpart to the single-manager methods, and the shared
 * base the filter and version helpers are built from.
 */
export async function mapPackageManagers<
  $result,
  $id extends string = PackageManagerId,
>(
  packageManagers: PackageManagers<$id>,
  mapFn: (packageManager: PackageManager<$id>) => Awaitable<$result>,
  options?: DetectPackageManagerOptions<$id>
) {
  return Promise.all(
    selectAllowedPackageManagers(packageManagers, options).map(
      (packageManager) => mapFn(packageManager)
    )
  );
}

export async function filterPackageManagers<
  $id extends string = PackageManagerId,
>(
  packageManagers: PackageManagers<$id>,
  filterFn: (packageManager: PackageManager<$id>) => Awaitable<boolean>,
  options?: DetectPackageManagerOptions<$id>
) {
  const matches = await mapPackageManagers(
    packageManagers,
    async (packageManager) =>
      (await filterFn(packageManager)) ? packageManager : undefined,
    options
  );

  return matches.filter(notFalsy);
}

function selectAllowedPackageManagers<$id extends string>(
  packageManagers: PackageManagers<$id>,
  options?: DetectPackageManagerOptions<$id>
) {
  return packageManagers.filter(({ id }) =>
    options?.allowed ? id in options.allowed : true
  );
}
