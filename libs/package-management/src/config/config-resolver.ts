import { readFileSync } from "node:fs";
import { entriesOf, fromEntries } from "@/utils";
import type { IsNever } from "@/types";
import { configLanguages, getConfigFormat } from "./config-format";
import type {
  ConfigFormat,
  ConfigSourceData,
  ConfigSourceInput,
  ConfigSourceInput as ConfigSourceOption,
} from "./config.types";

type InferConfig<$source extends ConfigSourceOption> =
  $source extends ConfigSourceOption<infer $config> ? $config : object;

type ResolvedConfigSourceData<
  $as extends "data" | "text" = never,
  $config extends object = object,
> =
  IsNever<$as> extends false
    ? $as extends string
      ? ConfigSourceData<$config>[$as]
      : ConfigSourceData<$config>
    : ConfigSourceData<$config>;

/**
 * A `filepath` names its own language through its extension; `text` and
 * `data` do not, so those say which language they are in.
 */
function resolveFormat(source: ConfigSourceInput): ConfigFormat {
  if (source.format) return source.format;

  const inferred = source.filepath
    ? getConfigFormat(source.filepath)
    : undefined;

  if (!inferred) {
    throw new Error(
      source.filepath
        ? `Unsupported config format: ${source.filepath}`
        : "A `format` is required for a text or data source"
    );
  }

  return inferred;
}

export function resolveConfigSource<
  $source extends ConfigSourceOption,
  $as extends "data" | "text" = never,
>(
  source: $source,
  as?: $as
): ResolvedConfigSourceData<$as, InferConfig<$source>> {
  const format = resolveFormat(source);

  const language = configLanguages[format];

  const { text: sourceText, data: sourceData, filepath } = source;

  const resolvers = {
    data: () => ({
      text: () => language.stringify(sourceData),
      data: () => sourceData as object,
    }),
    text: () => ({
      text: () => sourceText as string,
      data: () => language.parse(sourceText as string),
    }),
    filepath: () => {
      const text = readFileSync(filepath as string, "utf-8");

      return {
        text: () => text,
        data: () => language.parse(text),
      };
    },
  };

  // An empty string is a valid document to seed edits into, so only a
  // genuinely absent source is rejected.
  const selected = (["data", "text", "filepath"] as const).find(
    (key) => source[key] !== undefined
  );

  if (!selected) {
    throw new Error("Invalid source data");
  }

  const sourceResolvers = resolvers[selected]();

  const resolved = fromEntries(
    entriesOf(sourceResolvers).flatMap(([key, value]) => {
      // Only the requested representation is produced. Evaluating both means a
      // caller asking for `text` still pays for — and fails on — parsing.
      if (as && key !== as) return [];

      try {
        return [[key, value()] as const];
      } catch (error) {
        throw new Error(`Failed to resolve ${key} from ${selected}`, {
          cause: error,
        });
      }
    })
  ) as unknown as ConfigSourceData;

  if (as) {
    return resolved[as] as any;
  }

  return resolved as any;
}
