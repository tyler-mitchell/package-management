import { notFalsy } from "@/utils";
import type { SelectionMap } from "..";
import { dependencyTypeMap } from "./project-types";
import type {
  PackageDependencyItem,
  PackageDependencyType,
  PackageJson,
} from "./project-types";

export interface FindDependencyInPackageJsonOptions {
  name: string;
  type?: PackageDependencyType | AllowedDependencyTypesOption;
}

type AllowedDependencyTypesOption = SelectionMap<
  Record<PackageDependencyType, any>
>;

export function isDependencyInPackageJson(
  options: string | FindDependencyInPackageJsonOptions,
  packageJson?: PackageJson
) {
  return Boolean(findDependencyInPackageJson(options, packageJson));
}

export function findDependencyInPackageJson(
  option: string | FindDependencyInPackageJsonOptions,
  packageJson: PackageJson | undefined
) {
  const { name, type } =
    typeof option === "string" ? { name: option, type: undefined } : option;

  if (!packageJson) return undefined;

  const allowedTypes =
    typeof type === "string"
      ? {
          [type]: true,
        }
      : type ?? {
          dependency: true,
          devDependency: true,
        };

  const allowedDependencyTypes = getAllowedDependencyTypeList(allowedTypes);

  const matches = allowedDependencyTypes
    .map((type) => {
      return getPackageJsonDependencyItem({ name, type }, packageJson);
    })
    .filter(notFalsy);

  if (matches.length === 0) return undefined;

  return {
    firstMatch: matches[0],
    matches,
  };
}

function getPackageJsonDependencyItem(
  {
    name,
    type,
  }: {
    name: string;
    type: PackageDependencyType;
  },
  packageJson: PackageJson | undefined
): PackageDependencyItem | undefined {
  if (!packageJson) return undefined;

  const dependencyMap = getPackageJsonDependencyMap(type, packageJson);

  const version = dependencyMap?.[name];

  if (version === undefined) return undefined;

  return {
    name,
    version,
    type,
  };
}

function getAllowedDependencyTypeList(selected: AllowedDependencyTypesOption) {
  return Object.keys(dependencyTypeMap).filter(
    (key) => selected[key as PackageDependencyType]
  ) as PackageDependencyType[];
}

function getPackageJsonDependencyMap(
  type: PackageDependencyType,
  packageJson: PackageJson
): Record<string, string> | undefined {
  return packageJson[dependencyTypeMap[type]];
}
