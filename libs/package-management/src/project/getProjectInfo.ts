import type { PathOptions } from "@/types";
import type { PackageName } from "@/project/project-types";
import { getProjectInfoByName } from "@/project/getProjectInfoByName";
import { getPackageInfo } from "@/project/getPackageInfo";
import { getRootProjectInfo } from "@/project/getRootProjectInfo";
export type ProjectSourceType = "@root" | "@package" | (PackageName & {});

export function getProjectInfo(
  source: ProjectSourceType,
  options?: PathOptions
) {
  if (source === "@root") {
    return getRootProjectInfo(options);
  }
  if (source === "@package") {
    return getPackageInfo(options);
  }
  return getProjectInfoByName(source, options);
}
