import os from "node:os";
import process from "node:process";
import type { AliasDefinitionMap } from "./definePathAliases";
import { getWorkspaceFolder } from "./getWorkspaceFolder";
import { getPackageFolder } from "./getPackageFolder";
import { getGitRootFolder } from ".";
import { _filename, _dirname } from "@/fs/filename";

export type PathAlias = keyof PredefinedPathAliases;

export type PickPathAlias<K extends PathAlias> = K;

export type PredefinedPathAliases = typeof predefinedPathAliases;

export const predefinedPathAliases = {
  "<workspace_folder>": {
    resolve: (opts) => getWorkspaceFolder(opts),
    subpaths: [
      {
        to: "node_modules",
      },
      {
        to: "node_modules/.bin",
      },
    ],
  },
  "<workspace_folder?>": {
    resolve: (opts) => getWorkspaceFolder(opts),
    subpaths: [
      {
        to: "node_modules",
      },
      {
        to: "node_modules/.bin",
      },
    ],
  },
  "<package_folder>": {
    resolve: (opts) => getPackageFolder(opts)!,
    subpaths: [
      {
        to: "node_modules",
      },
      {
        to: "node_modules/.bin",
      },
      {
        to: "src",
      },
    ],
  },
  "<gitroot_folder>": {
    resolve: (opts) => getGitRootFolder(opts)!,
    subpaths: [
      {
        to: "node_modules",
      },
      {
        to: "node_modules/.bin",
      },
      {
        to: ".vscode",
      },
    ],
  },
  "<user_home>": {
    resolve: () => os.homedir(),
    subpaths: [] as any[],
  },
  "<user_tmpdir>": {
    resolve: () => os.tmpdir(),
    subpaths: [] as any[],
  },
  "<cwd>": {
    resolve: () => process.cwd(),
    subpaths: [] as any[],
  },
  "<current_file>": {
    // resolve: () => fileURLToPath(import.meta.url),
    resolve: () => _filename({ rootFunctionName: "getFilePath" }) ?? "",
    subpaths: [] as any[],
  },
  "<current_folder>": {
    // resolve: () => fileURLToPath(import.meta.url),
    resolve: () => _dirname({ rootFunctionName: "getFilePath" }) ?? "",
    subpaths: [] as any[],
  },
} as const satisfies AliasDefinitionMap;
