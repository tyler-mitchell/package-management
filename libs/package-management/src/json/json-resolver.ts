import { readFileSync } from "node:fs";
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
      data: () => JSON.parse(text),
    };
  },

  filepath: (filepath: string) => {
    const text = readFileSync(filepath, "utf-8");
    return {
      text: () => text,
      data: () => JSON.parse(text),
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

  if (!sourceType || !(sourceType in jsonSourceResolvers) || !sourceData) {
    throw new Error("Invalid source data");
  }

  const sourceTypeResolvers = jsonSourceResolvers[sourceType as JsonSourceType](
    sourceData as never
  );

  const resolved = morph(sourceTypeResolvers, (key, v) => {
    try {
      const value = v();
      return !as || key === as ? [key, value] : [];
    } catch (e) {
      throw new Error(`Failed to resolve ${key} from ${sourceType}`);
    }
  });

  if (as) {
    return resolved[as] as any;
  }

  return resolved as any;
}
