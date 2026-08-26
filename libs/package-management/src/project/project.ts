import path from "pathe";
import type { PathOptions } from "@/types";
import { readPackageInfo } from "./getPackageProjectInfo";
import { tsconfig } from "@/tsconfig/tsconfig";
import { gitignore } from "@/gitignore";
import {
  type FindDependencyInPackageJsonOptions,
  isDependencyInPackageJson,
  findDependencyInPackageJson,
} from "./findDependencyInPackageJson";
import { getProjectInfo, type ProjectFolderTypeOption } from "./getProjectInfo";
import { definePackageManagerClient } from "@/package-manager/package-managers";

export type ProjectParams = [
  source: ProjectFolderTypeOption,
  options?: PathOptions,
];

export const project = (...args: ProjectParams) => {
  const [source, projectOptions] = args;

  const {
    packageJson,
    name: packageName,
    dirpath: projectDir,
    path: packageJsonPath,
  } = getProjectInfo(source, projectOptions) ?? {};

  const {
    findPackageManager,
    detectPackageManagers,
    detectLockfilePackageManagers,
    detectGlobalPackageManagers,
    globalVersions,

    filterPackageManagers,
    mapPackageManagers,
  } = definePackageManagerClient({ cwd: projectDir });

  /**
   * A project does not move, so its location is resolved once — but installs
   * rewrite its package.json, so that is read through `readPackageInfo`, which
   * re-parses only when the file has actually changed.
   */
  const getPackageJson = () =>
    projectDir
      ? readPackageInfo({ packageDir: projectDir }).packageJson
      : packageJson;

  return {
    packageJson,

    packageJsonPath,

    packageName,

    projectDir,

    findPackageManager,

    detectPackageManagers,

    detectGlobalPackageManagers,

    detectLockfilePackageManagers,

    globalVersions,

    mapPackageManagers,

    tsconfig: tsconfig(projectDir ?? ""),

    gitignore: gitignore(path.join(projectDir ?? "", ".gitignore")),

    filterPackageManagers,

    getPackageJson,

    findDependencyInPackageJson: (
      options: string | FindDependencyInPackageJsonOptions
    ) => findDependencyInPackageJson(options, getPackageJson()),

    isDependencyInPackageJson: (
      options: string | FindDependencyInPackageJsonOptions
    ) => isDependencyInPackageJson(options, getPackageJson()),
  };
};
