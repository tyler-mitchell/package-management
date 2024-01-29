import * as WST from "workspace-tools";
import { getRootDirectory } from "../project/getRootProjectDirectory";
import { getRootProjectInfo } from "@/project/getRootProjectInfo";

export interface GetPackageInfoListOptions {
  cwd?: string;
  includeRoot?: boolean;
}

export function getWorkspacePackageInfoList(
  options?: GetPackageInfoListOptions
) {
  const { workspaceDir, resolveWstList } = common(options);

  const wstList = WST.getWorkspaces(workspaceDir);

  return resolveWstList(wstList);
}

export async function getPackageInfoListAsync(
  options?: GetPackageInfoListOptions
) {
  const { workspaceDir, resolveWstList } = common(options);

  const wstList = await WST.getWorkspacesAsync(workspaceDir);

  return resolveWstList(wstList);
}

function common(options?: GetPackageInfoListOptions) {
  const { cwd, includeRoot: includeWorkspace } = options ?? {};
  const workspaceDir = getRootDirectory({ cwd });

  function resolveWstList(list: WST.WorkspaceInfo) {
    if (!workspaceDir) return [];

    if (includeWorkspace) return [getRootProjectInfo(), ...list];

    return list;
  }

  return {
    workspaceDir,
    includeWorkspace,
    resolveWstList,
  };
}
