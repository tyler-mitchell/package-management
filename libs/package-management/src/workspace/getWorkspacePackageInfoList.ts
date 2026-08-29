import * as WST from "workspace-tools";
import { join } from "pathe";
import { getWorkspaceFolder } from "../path/getWorkspaceFolder";
import { getWorkspaceProjectInfo } from "@/project/getWorkspaceProjectInfo";
import type { PackageInfo, PackageJson } from "@/project/project-types";

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

/**
 * `workspace-tools` reports a package's directory as `path` and has no
 * `dirpath`, while this library's `PackageInfo` uses `path` for the
 * package.json and `dirpath` for the directory. Asserting one shape onto the
 * other left `dirpath` undefined on every workspace package and gave `path`
 * two different meanings within the same list.
 */
function toPackageInfo(info: WST.WorkspacePackageInfo): PackageInfo {
  return {
    name: info.name,
    dirpath: info.path,
    path: join(info.path, "package.json"),
    packageJson: info.packageJson as PackageJson,
  };
}

function common(options?: GetPackageInfoListOptions) {
  const { cwd, includeRoot: includeWorkspace } = options ?? {};

  const workspaceDir = getWorkspaceFolder({ cwd });

  function resolveWstList(
    list: WST.WorkspaceInfos | undefined
  ): PackageInfo[] {
    // `getWorkspaceInfos` reports `undefined` when the directory is not a
    // workspace, which is a normal outcome rather than a failure.
    if (!workspaceDir || !list) return [];

    const packages = list.map(toPackageInfo);

    return includeWorkspace
      ? [getWorkspaceProjectInfo({ cwd }), ...packages]
      : packages;
  }

  return {
    workspaceDir,
    includeWorkspace,
    resolveWstList,
  };
}
