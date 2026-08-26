import { getPackageFolder } from "../path/getPackageFolder";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { PackageInfo, PackageJson } from "./project-types";
import type { PathOptions } from "..";

export function getPackageInfo(options?: PathOptions) {
  const packageDir = getPackageFolder(options);
  return readPackageInfo({ packageDir });
}

export function readPackageInfo({
  packageDir,
}: {
  packageDir: string;
}): PackageInfo {
  const packageJsonPath = path.join(packageDir, "package.json");

  const packageJson = readPackageJson(packageJsonPath);

  return {
    name: packageJson.name!,
    path: packageJsonPath,
    dirpath: packageDir,
    packageJson,
  };
}

const packageJsonCache = new Map<
  string,
  { mtimeMs: number; packageJson: PackageJson }
>();

/**
 * Installs and uninstalls rewrite package.json, so it cannot simply be read
 * once. Keying on modification time re-parses when the file actually changed
 * and returns the previous value otherwise — a stat instead of a read and a
 * parse on every lookup.
 */
function readPackageJson(packageJsonPath: string) {
  const { mtimeMs } = statSync(packageJsonPath);

  const cached = packageJsonCache.get(packageJsonPath);

  if (cached?.mtimeMs === mtimeMs) return cached.packageJson;

  const packageJson = JSON.parse(
    readFileSync(packageJsonPath, "utf-8")
  ) as PackageJson;

  packageJsonCache.set(packageJsonPath, { mtimeMs, packageJson });

  return packageJson;
}
