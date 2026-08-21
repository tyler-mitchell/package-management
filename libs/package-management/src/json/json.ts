import { writeFileSync } from "node:fs";
import { modify, applyEdits } from "jsonc-parser";
import type { ModificationOptions } from "jsonc-parser";
import { checkResult, toArray } from "@/utils";
import type { CheckResult } from "@/types";
import type { JsonSourceData, JsonSourceInput } from "./json.types";
import { resolveJsonSource } from "./json-resolver";

export interface JSONEditMap {
  [$dot_path: string | number]: Omit<JSONEditData, "path">;
}

export interface JSONEditData {
  path: (string | number)[] | string | number;
  value: any;
  options?: JSONEditOptions;
}

interface JSONCEditDataResolved extends JSONEditData {
  path: (string | number)[];
}

export interface JSONEditOptions extends ModificationOptions {
  /** @default "."  */
  pathSeparator?: string | false;
}

export type JSONEdits = JSONEditMap | JSONEditData[];

function resolveEditPath(
  path: string | number | Array<string | number>,
  options?: {
    pathSeparator?: string | false;
  }
): (string | number)[] {
  const { pathSeparator = "." } = options || {};
  const arr = toArray(path);

  return arr
    .map((path) => {
      if (typeof path === "string") {
        return pathSeparator === false ? path : path.split(pathSeparator);
      }
      return path;
    })
    .flat();
}

function parseJSONCEdits(edits: JSONEdits): JSONCEditDataResolved[] {
  if (Array.isArray(edits)) {
    return edits.map(({ path, ...edit }) => ({
      path: resolveEditPath(path),
      ...edit,
    }));
  }

  return Object.entries(edits).map(
    ([path, value]): JSONCEditDataResolved => ({
      path: resolveEditPath(path),
      ...value,
    })
  );
}

export interface ModifyJSONCDataOptions<$data extends object = object> {
  json: JsonSourceInput<$data>;
  edits: JSONEdits;
  defaultEditOptions?: JSONEditOptions;
}

type ModifyJSONDataResult = CheckResult<JsonSourceData>;

export function modifyJSON({
  json,
  edits,
  defaultEditOptions,
}: ModifyJSONCDataOptions): ModifyJSONDataResult {
  return checkResult(() => {
    const text = resolveJsonSource(json, "text");

    const jsoncEdits = parseJSONCEdits(edits);

    const editResult = jsoncEdits.flatMap((edit) =>
      modify(text, edit.path, edit.value, {
        ...defaultEditOptions,
        ...edit.options,
      })
    );

    const updated = applyEdits(text, editResult);

    return resolveJsonSource({ text: updated });
  });
}

export interface MoodifyJSONFileOptions<
  $auto_commit extends boolean = boolean,
> {
  autoCommit?: $auto_commit;
  defaultEditOptions?: JSONEditOptions;
}

type ModifyJSONFileResult<$auto_commit extends boolean = true> =
  $auto_commit extends true
    ? CheckResult<JsonSourceData>
    : CheckResult<{
        json: JsonSourceData;
        commit: () => void;
      }>;

export function modifyJSONFile<$auto_commit extends boolean = true>(
  filepath: string,
  edits: JSONEdits,
  options?: MoodifyJSONFileOptions<$auto_commit>
): ModifyJSONFileResult<$auto_commit> {
  return checkResult(() => {
    const { autoCommit = true, defaultEditOptions } = options || {};

    const { data: json, error } = modifyJSON({
      json: { filepath },
      edits,
      defaultEditOptions,
    });

    if (error) {
      throw error;
    }

    const commit = () => writeFileSync(filepath, json.text);

    if (autoCommit) {
      commit();
      return json;
    }

    return {
      json,
      commit,
    };
  }) as ModifyJSONFileResult<$auto_commit>;
}
