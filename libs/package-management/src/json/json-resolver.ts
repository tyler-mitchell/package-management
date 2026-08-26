import { readFileSync } from "node:fs";
import { parse as parseJsonc } from "jsonc-parser";
import type {
  JsonSourceData,
  JsonSourceInput,
  JsonSourceInput as JsonSourceOption,
  JsonSourceInputType as JsonSourceType,
} from "./json.types";
import { morph, type isNever } from "@arktype/util";

type JsonSourceResolvers<$data extends object = object> = {
  [K in keyof Required<JsonSourceInput>]: (
    input: Required<JsonSourceInput>[K]
  ) => {
    text: () => string;
    data: () => $data;
  };
};

const jsonSourceResolvers: JsonSourceResolvers = {
  data: (json: object) => {
    return {
      text: () => JSON.stringify(json),
      data: () => json,
    };
  },

  text: (text: string) => {
    return {
      text: () => text,
      // `jsonc-parser`'s parse, not `JSON.parse`: the whole point of this
      // module is editing files like tsconfig.json, which carry comments.
      data: () => parseJsonc(text),
    };
  },

  filepath: (filepath: string) => {
    const text = readFileSync(filepath, "utf-8");
    return {
      text: () => text,
      // `jsonc-parser`'s parse, not `JSON.parse`: the whole point of this
      // module is editing files like tsconfig.json, which carry comments.
      data: () => parseJsonc(text),
    };
  },
};

type InferJson<$source extends JsonSourceOption> =
  $source extends JsonSourceOption<infer $json> ? $json : object;

type ResolvedJsonSourceData<
  $as extends "data" | "text" = never,
  $json extends object = object,
> =
  isNever<$as> extends false
    ? $as extends string
      ? JsonSourceData<$json>[$as]
      : JsonSourceData<$json>
    : JsonSourceData<$json>;

export function resolveJsonSource<
  $source extends JsonSourceOption,
  $as extends "data" | "text" = never,
>(source: $source, as?: $as): ResolvedJsonSourceData<$as, InferJson<$source>> {
  const [sourceType, sourceData] =
    Object.entries(source).find(([_, selected]) => selected !== undefined) ??
    [];

  // An empty string is a valid document to seed edits into, so only a genuinely
  // absent source is rejected.
  if (
    !sourceType ||
    !(sourceType in jsonSourceResolvers) ||
    sourceData === undefined
  ) {
    throw new Error("Invalid source data");
  }

  const sourceTypeResolvers = jsonSourceResolvers[sourceType as JsonSourceType](
    sourceData as never
  );

  const resolved = morph(sourceTypeResolvers, (key, v) => {
    // Only the requested representation is produced. Evaluating both meant a
    // caller asking for `text` still paid for — and failed on — parsing.
    if (as && key !== as) return [];

    try {
      return [key, v()];
    } catch (error) {
      throw new Error(`Failed to resolve ${key} from ${sourceType}`, {
        cause: error,
      });
    }
  });

  if (as) {
    return resolved[as] as any;
  }

  return resolved as any;
}
