import type { Func, PathOptions } from "@/types";
import type { PackageName } from "@/project/project-types";
import { getProjectInfoByName } from "@/project/getProjectInfoByName";
import { getPackageInfo } from "@/project/getPackageProjectInfo";
import { getWorkspaceProjectInfo } from "@/project/getWorkspaceProjectInfo";
import type { GetWorkspaceFolderOptions, PickPathAlias } from "@/path";
import type { RequireExactlyOne } from "@/types/type-utils";

export type ProjectFolderTypeOption =
  | WorkspaceFolderTypeOption
  | PackageFolderTypeOption
  | GitRootFolderTypeOption
  | PackageNameFolderTypeOption;

export function getProjectInfo(
  folder: ProjectFolderTypeOption,
  options?: PathOptions
) {
  if (isWorkspaceFolderTypeOption(folder)) {
    return getWorkspaceProjectInfo(
      parseWorkspaceFolderTypeOptions(folder, options)
    );
  }

  if (folder === "<package_folder>") {
    return getPackageInfo(options);
  }

  if (folder === "<gitroot_folder>") {
    return getPackageInfo(options);
  }

  return getProjectInfoByName(folder.packageName, options);
}

export type PackageFolderTypeOption = PickPathAlias<"<package_folder>">;

export type GitRootFolderTypeOption = PickPathAlias<"<gitroot_folder>">;

export type PackageNameFolderTypeOption = RequireExactlyOne<{
  packageName: PackageName;
}>;

export type WorkspaceFolderTypeOption =
  | PickPathAlias<"<workspace_folder>">
  | RequireExactlyOne<{
      "<workspace_folder>": Pick<
        GetWorkspaceFolderOptions,
        "fallbackToGitRoot" | "throwIfNotFound"
      >;
    }>;

function isWorkspaceFolderTypeOption(
  option: ProjectFolderTypeOption
): option is WorkspaceFolderTypeOption {
  return Boolean(
    option === "<workspace_folder>" ||
      (typeof option === "object" && "<workspace_folder>" in option)
  );
}

function parseWorkspaceFolderTypeOptions(
  option: WorkspaceFolderTypeOption,
  defaultOptions?: PathOptions
): GetWorkspaceFolderOptions {
  if (typeof option === "string") {
    return defaultOptions ?? {};
  }

  return { ...defaultOptions, ...option["<workspace_folder>"] };
}

getProjectInfo({
  "<workspace_folder>": {},
});
