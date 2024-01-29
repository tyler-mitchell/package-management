import { readFileSync } from "node:fs";
import gitignoreParser from "parse-gitignore";
import type {
  GitignoreParseOptions,
  ParsedGitignoreObject,
} from "parse-gitignore";

export type {
  GitignoreParseOptions,
  ParsedGitignoreObject,
} from "parse-gitignore";

function parseGitignoreFile(
  gitignorePath: string,
  options?: GitignoreParseOptions
): ParsedGitignoreObject {
  return gitignoreParser(gitignorePath, options);
}

function getGitignoreData(gitignorePath: string) {
  const gitignoreFileContent = readFileSync(gitignorePath, "utf-8");

  const gitignores = parseGitignoreFile(gitignoreFileContent);

  return gitignores;
}

export const gitignore = (gitignorePath: string) => ({
  get data() {
    return getGitignoreData(gitignorePath);
  },

  get patterns() {
    return getGitignoreData(gitignorePath).patterns;
  },
});
