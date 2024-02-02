import path from "pathe";
import type { Func, PathOptions } from "@/types";
import type { PackageName } from "./project-types";
import { getProjectInfoByName } from "./getProjectInfoByName";
import { getPackageInfo } from "./getPackageProjectInfo";
import { getWorkspaceProjectInfo } from "./getWorkspaceProjectInfo";
import { tsconfig } from "@/tsconfig/tsconfig";
import { gitignore } from "@/gitignore";
import {
  type FindDependencyInPackageJsonOptions,
  isDependencyInPackageJson,
  findDependencyInPackageJson,
} from "./findDependencyInPackageJson";
import { getProjectInfo, type ProjectFolderTypeOption } from "./getProjectInfo";
import { findPackageManager } from "..";
import { definePackageManagerClient } from "@/package-manager/package-managers";

export type ProjectParams = [
  source: ProjectFolderTypeOption,
  options?: PathOptions,
];

export const project = (...args: ProjectParams) => {
  const [source, projectOptions] = args;

  const { packageJson, packageJsonPath, packageName, projectDir } = info();

  const {
    findPackageManager,
    detectPackageManagers,
    detectLockfilePackageManagers,
    detectGlobalPackageManagers,

    filterPackageManagers,
  } = definePackageManagerClient({ cwd: projectDir });

  return {
    packageJson,

    packageJsonPath,

    packageName,

    projectDir,

    findPackageManager,

    detectPackageManagers,

    detectGlobalPackageManagers,

    detectLockfilePackageManagers,

    tsconfig: tsconfig(projectDir ?? ""),

    gitignore: gitignore(path.join(projectDir ?? "", ".gitignore")),

    filterPackageManagers,

    getPackageJson: () => get("packageJson"),

    findDependencyInPackageJson: (
      options: string | FindDependencyInPackageJsonOptions
    ) => findDependencyInPackageJson(options, get("packageJson")),

    isDependencyInPackageJson: (
      options: string | FindDependencyInPackageJsonOptions
    ) => isDependencyInPackageJson(options, get("packageJson")),
  };

  function info() {
    const {
      packageJson,
      name: packageName,
      dirpath: projectDir,
      path: packageJsonPath,
    } = getProjectInfo(source, projectOptions) ?? {};

    return {
      packageJson,
      packageJsonPath,
      packageName,
      projectDir,
    };
  }

  function get<K extends keyof ReturnType<typeof info>>(key: K) {
    return info()[key]!;
  }
};
