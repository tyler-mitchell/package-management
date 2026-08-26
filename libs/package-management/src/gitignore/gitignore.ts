import { existsSync, readFileSync } from "node:fs";
import gitignoreParser from "parse-gitignore";
import type {
  GitignoreParseOptions,
  ParsedGitignoreObject,
} from "parse-gitignore";

export type {
  GitignoreParseOptions,
  ParsedGitignoreObject,
} from "parse-gitignore";

function parseGitignoreContent(
  // The parser takes the file's contents, not its path — the previous name
  // said otherwise and made the call site read as though it took a path.
  gitignoreContent: string,
  options?: GitignoreParseOptions
): ParsedGitignoreObject {
  return gitignoreParser(gitignoreContent, options);
}

function getGitignoreData(
  gitignorePath: string,
  options?: GitignoreParseOptions
) {
  // A project without a .gitignore is ordinary, and `project()` builds one of
  // these for every project — so a missing file is an empty rule set, not an
  // ENOENT thrown from a property read.
  if (!existsSync(gitignorePath)) return parseGitignoreContent("", options);

  return parseGitignoreContent(readFileSync(gitignorePath, "utf-8"), options);
}

export const gitignore = (gitignorePath: string) => ({
  get data() {
    return getGitignoreData(gitignorePath);
  },

  get patterns() {
    return getGitignoreData(gitignorePath).patterns;
  },
});
