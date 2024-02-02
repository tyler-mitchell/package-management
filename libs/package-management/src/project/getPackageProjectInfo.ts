import { getPackageFolder } from "../path/getPackageFolder";
import { readFileSync } from "node:fs";
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

  const packageJson = JSON.parse(
    readFileSync(packageJsonPath, "utf-8")
  ) as PackageJson;

  return {
    name: packageJson.name!,
    path: packageJsonPath,
    dirpath: packageDir,
    packageJson,
  };
}
