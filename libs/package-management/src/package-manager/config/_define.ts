import type { PackageManagerConfig } from "@/package-manager/package-manager-types";

export function definePackageManagerConfig<ID extends string>(
  config: PackageManagerConfig<ID>
) {
  return config;
}
