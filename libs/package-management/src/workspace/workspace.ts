import { ProjectParams, project } from "@/project";
import { getRootDirectory } from "../project/getRootProjectDirectory";
import { getWorkspacePackageInfoMap } from "./getWorkspacePackageInfoMap";
import { getWorkspacePackageNames } from "./getWorkspacePackageNames";
import { getWorkspacePackageInfoList } from "./getWorkspacePackageInfoList";

export const workspace = {
  packageNames: getWorkspacePackageNames,
  packageGraph: getWorkspacePackageInfoMap,
  packageList: getWorkspacePackageInfoList,
  workspaceRootDir: getRootDirectory,
  getProject: project,
};
