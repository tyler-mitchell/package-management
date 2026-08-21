import * as WST from "workspace-tools";
import { getWorkspaceFolder } from "../path/getWorkspaceFolder";
import { getWorkspaceProjectInfo } from "@/project/getWorkspaceProjectInfo";

export interface GetPackageInfoListOptions {
  cwd?: string;
  includeRoot?: boolean;
}

export function getWorkspacePackageInfoList(
  options?: GetPackageInfoListOptions
) {
  const { workspaceDir, resolveWstList } = common(options);

  const wstList = WST.getWorkspaceInfos(workspaceDir);

  return resolveWstList(wstList);
}

export async function getPackageInfoListAsync(
  options?: GetPackageInfoListOptions
) {
  const { workspaceDir, resolveWstList } = common(options);

  const wstList = await WST.getWorkspaceInfosAsync(workspaceDir);

  return resolveWstList(wstList);
}

function common(options?: GetPackageInfoListOptions) {
  const { cwd, includeRoot: includeWorkspace } = options ?? {};
  const workspaceDir = getWorkspaceFolder({ cwd });

  // `getWorkspaceInfos` reports `undefined` when the directory is not a
  // workspace, which is a normal outcome rather than a failure.
  function resolveWstList(list: WST.WorkspaceInfos | undefined) {
    if (!workspaceDir || !list) return [];

    if (includeWorkspace) return [getWorkspaceProjectInfo(), ...list];

    return list;
  }

  return {
    workspaceDir,
    includeWorkspace,
    resolveWstList,
  };
}
