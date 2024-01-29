import type { KeyOfValue, SelectionMap, __ } from "@/types";
import type { Options as ShellOptions } from "execa";
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
        dev: string;
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

export type InstallPackageOptions = PackageManagerScriptOptions<"install">;

export type UninstallPackageOptions = PackageManagerScriptOptions<"uninstall">;

export type PackageManagerCommands = PackageManagerConfig["args"];

export type PackageManagerCommandName = keyof PackageManagerCommands;

export type PackageManagerCommandSpec<K> =
  KeyOfValue<PackageManagerCommands, K> extends { options: infer O }
    ? SelectionMap<O>
    : Record<never, never>;

export type PackageManagerScriptOptions<
  K extends PackageManagerCommandName | undefined = undefined,
> = __<
  {
    cwd?: string;
    silent?: boolean;
    shellOptions?: ShellOptions;
  } & PackageManagerCommandSpec<K>
>;
