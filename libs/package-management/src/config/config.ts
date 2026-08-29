import { writeFileSync } from "node:fs";
import { checkResult } from "@/utils";
import type { CheckResult } from "@/types";
import { modifyJSON } from "@/json";
import type { JSONEditData, JSONEditOptions, JSONEdits } from "@/json";
import { configLanguages, getConfigFormat } from "./config-format";
import { resolveConfigSource } from "./config-resolver";
import type { ConfigFormat, ConfigSourceData, ConfigSourceInput } from "./config.types";

/**
 * One edit vocabulary across every language. A dot path addresses nesting,
 * an array spells segments out literally, and both are what `modifyJSON`
 * already accepts — so an edit written for `package.json` reads the same
 * written for `config.toml`.
 */
export type ConfigEdits = JSONEdits;
export type ConfigEditData = JSONEditData;
export type ConfigEditOptions = JSONEditOptions;

const toPathSegment = (segment: string) =>
  /^\d+$/.test(segment) ? Number(segment) : segment;

function resolveEditPath(
  path: ConfigEditData["path"],
  options?: ConfigEditOptions
): (string | number)[] {
  const { pathSeparator = "." } = options || {};

  // An array is the caller spelling out the segments, so its elements are
  // taken literally. Splitting them too makes any key containing the
  // separator — `tool."my.section"` — impossible to address.
  if (Array.isArray(path)) return path;

  if (typeof path === "number" || pathSeparator === false) return [path];

  return path.split(pathSeparator).map(toPathSegment);
}

function toEditList(
  edits: ConfigEdits,
  defaultEditOptions?: ConfigEditOptions
): { path: (string | number)[]; value: any }[] {
  const entries: ConfigEditData[] = Array.isArray(edits)
    ? edits
    : Object.entries(edits).map(([path, edit]) => ({ path, ...edit }));

  return entries.map(({ path, value, options }) => ({
    path: resolveEditPath(path, { ...defaultEditOptions, ...options }),
    value,
  }));
}

/**
 * Written back into a copy so a caller's own object is never mutated, and
 * missing parents are created the way a JSON edit creates them.
 */
function setPath(
  target: any,
  path: (string | number)[],
  value: unknown
): any {
  const [head, ...rest] = path;

  if (head === undefined) return value;

  const container: any = Array.isArray(target)
    ? [...target]
    : { ...(target ?? {}) };

  container[head] = setPath(container[head], rest, value);

  return container;
}

export interface ModifyConfigOptions<$config extends object = object> {
  config: ConfigSourceInput<$config>;
  edits: ConfigEdits;
  defaultEditOptions?: ConfigEditOptions;
}

export function modifyConfig({
  config,
  edits,
  defaultEditOptions,
}: ModifyConfigOptions): CheckResult<ConfigSourceData> {
  return checkResult(() => {
    const format: ConfigFormat =
      config.format ??
      (config.filepath ? getConfigFormat(config.filepath) : undefined) ??
      "json";

    const language = configLanguages[format];

    // The JSON family keeps its surgical editor: `jsonc-parser` rewrites only
    // the span an edit touches, so comments and formatting survive.
    if (language.surgical) {
      const { data, error } = modifyJSON({
        json: config.filepath
          ? { filepath: config.filepath }
          : config.text !== undefined
            ? { text: config.text }
            : { data: config.data as object },
        edits,
        defaultEditOptions,
      });

      if (error) throw error;

      return data;
    }

    const current = resolveConfigSource(config, "data");

    const updated = toEditList(edits, defaultEditOptions).reduce(
      (result, edit) => setPath(result, edit.path, edit.value),
      current as any
    );

    return resolveConfigSource({ text: language.stringify(updated), format });
  });
}

export interface ModifyConfigFileOptions<
  $auto_commit extends boolean = boolean,
> {
  autoCommit?: $auto_commit;
  defaultEditOptions?: ConfigEditOptions;
  /** Overrides the format the file's extension implies. */
  format?: ConfigFormat;
}

type ModifyConfigFileResult<$auto_commit extends boolean = true> =
  $auto_commit extends true
    ? CheckResult<ConfigSourceData>
    : CheckResult<{
        config: ConfigSourceData;
        commit: () => void;
      }>;

export function modifyConfigFile<$auto_commit extends boolean = true>(
  filepath: string,
  edits: ConfigEdits,
  options?: ModifyConfigFileOptions<$auto_commit>
): ModifyConfigFileResult<$auto_commit> {
  return checkResult(() => {
    const { autoCommit = true, defaultEditOptions, format } = options || {};

    const { data: config, error } = modifyConfig({
      config: format ? { filepath, format } : { filepath },
      edits,
      defaultEditOptions,
    });

    if (error) {
      throw error;
    }

    const commit = () => writeFileSync(filepath, config.text);

    if (autoCommit) {
      commit();
      return config;
    }

    return {
      config,
      commit,
    };
  }) as ModifyConfigFileResult<$auto_commit>;
}
