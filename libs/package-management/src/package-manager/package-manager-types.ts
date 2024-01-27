import type { KeyOfValue, SelectionMap } from "@/types";
export interface PackageManagerConfig<ID extends string = string> {
  id: ID;
  command: string;
  name: string;
  meta: {
    lockfile: string | string[];
  };
  runner: string;
  args: {
    install: {
      command: string;
      options: {
        preferOffline: string;
        isDevDependency: string;
      };
    };
    uninstall: {
      command: string;
    };
  };
  options: {
    version: string;
  };
}

export type PackageManagerCommands = PackageManagerConfig["args"];

export type PackageManagerCommandName = keyof PackageManagerCommands;

export type PackageManagerCommandSpec<K> =
  KeyOfValue<PackageManagerCommands, K> extends { options: infer O }
    ? SelectionMap<O>
    : Record<never, never>;
