import type { PathOptions } from "@/types";
import type { GetWorkspaceFolderOptions } from "../path/getWorkspaceFolder";
import { getWorkspaceFolder } from "../path/getWorkspaceFolder";
import { readPackageInfo } from "./getPackageProjectInfo";

export function getWorkspaceProjectInfo(options?: GetWorkspaceFolderOptions) {
  try {
    const workspaceDir = getWorkspaceFolder(options);

    return readPackageInfo({ packageDir: workspaceDir });
  } catch (e) {
    console.error(e);
    throw new Error("Root workspace not found");
  }
}
