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

/**
 * `jsonc-parser` addresses an array element by a numeric segment and throws
 * when given the string form, so digit-only segments are coerced.
 */
const toPathSegment = (segment: string) =>
  /^\d+$/.test(segment) ? Number(segment) : segment;

function resolveEditPath(
  path: string | number | Array<string | number>,
  options?: {
    pathSeparator?: string | false;
  }
): (string | number)[] {
  const { pathSeparator = "." } = options || {};

  // An array is the caller spelling out the segments, so its elements are
  // taken literally. Splitting them too makes any key containing the separator
  // — `exports["./index.js"]`, `paths["foo.bar/*"]` — impossible to address.
  if (Array.isArray(path)) return path;

  if (typeof path === "number" || pathSeparator === false) return [path];

  return path.split(pathSeparator).map(toPathSegment);
}

function parseJSONCEdits(
  edits: JSONEdits,
  defaultEditOptions?: JSONEditOptions
): JSONCEditDataResolved[] {
  const resolve = (
    path: JSONEditData["path"],
    options?: JSONEditOptions
  ) => resolveEditPath(path, { ...defaultEditOptions, ...options });

  if (Array.isArray(edits)) {
    return edits.map(({ path, ...edit }) => ({
      path: resolve(path, edit.options),
      ...edit,
    }));
  }

  return Object.entries(edits).map(
    ([path, value]): JSONCEditDataResolved => ({
      path: resolve(path, value.options),
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

    const jsoncEdits = parseJSONCEdits(edits, defaultEditOptions);

    // Applied one at a time, each against the result of the last. Computing
    // every edit from the original text makes edits blind to each other: two
    // that create the same missing parent each synthesize it, producing a
    // duplicate key, and two touching the same key are rejected as overlapping.
    const updated = jsoncEdits.reduce(
      (current, edit) =>
        applyEdits(
          current,
          modify(current, edit.path, edit.value, {
            ...defaultEditOptions,
            ...edit.options,
          })
        ),
      text
    );

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
