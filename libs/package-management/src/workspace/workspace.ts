import { project } from "@/project";
import { getWorkspaceFolder } from "../path/getWorkspaceFolder";
import { getWorkspacePackageInfoMap } from "./getWorkspacePackageInfoMap";
import { getWorkspacePackageNames } from "./getWorkspacePackageNames";
import { getWorkspacePackageInfoList } from "./getWorkspacePackageInfoList";

export const workspace = {
  packageNames: getWorkspacePackageNames,
  packageGraph: getWorkspacePackageInfoMap,
  packageList: getWorkspacePackageInfoList,
  workspaceRootDir: getWorkspaceFolder,
  getProject: project,
};
