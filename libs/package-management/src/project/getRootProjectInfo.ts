import type { PathOptions } from "@/types";
import { getRootDirectory } from "./getRootProjectDirectory";
import { readPackageInfo } from "./getPackageInfo";

export function getRootProjectInfo(options?: PathOptions) {
  try {
    const workspaceDir = getRootDirectory({ cwd: options?.cwd });

    return readPackageInfo({ packageDir: workspaceDir });
  } catch (e) {
    console.error(e);
    throw new Error("Root workspace not found");
  }
}
