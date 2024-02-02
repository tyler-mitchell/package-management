import { readFileSync, writeFileSync } from "node:fs";
import { modify, applyEdits, type JSONPath } from "jsonc-parser";

export interface JSONCEdit {
  paths: JSONPath;
  update: unknown;
}

export interface WriteJSONCFileOptions {
  edits: JSONCEdit[] | JSONCEdit;
  filepath: string;
  autoCommit?: boolean;
}

type JSONCEdits = JSONCEdit[] | JSONCEdit;

function modifyJSONCFileSync({
  edits,
  filepath,
  autoCommit = true,
}: WriteJSONCFileOptions) {
  const jsoncContent = readFileSync(filepath, "utf-8");

  const modifiers = Array.isArray(edits) ? edits : [edits];

  const editResult = modifiers.flatMap((edit) =>
    modify(jsoncContent, edit.paths, edit.update, {
      formattingOptions: { tabSize: 0, insertSpaces: false },
    })
  );

  const updatedFileContent = applyEdits(jsoncContent, editResult);

  const commit = () => writeFileSync(filepath, updatedFileContent);

  if (autoCommit) {
    commit();
  }

  return {
    updatedFileContent,
    commit,
  };
}

export const jsonc = (filepath: string) => {
  return {
    modify: (edits: JSONCEdits, options?: { filepath?: string }) =>
      modifyJSONCFileSync({ edits, filepath, ...options }),
  };
};
