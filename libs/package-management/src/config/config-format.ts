import {
  parseJSON5,
  parseJSONC,
  parseTOML,
  parseYAML,
  stringifyJSON5,
  stringifyJSONC,
  stringifyTOML,
  stringifyYAML,
} from "confbox";
import { extname } from "pathe";
import type { ConfigFormat } from "./config.types";

interface ConfigLanguage {
  parse: (text: string) => any;
  stringify: (data: any) => string;
  /**
   * Whether an edit rewrites only the span it touches. The JSON family is
   * edited through `jsonc-parser`, which leaves the rest of the document —
   * comments, key order, indentation — byte for byte. YAML and TOML are
   * parsed and re-serialized, so comments in them do not survive an edit.
   */
  surgical: boolean;
}

export const configLanguages = {
  json: { parse: parseJSONC, stringify: stringifyJSONC, surgical: true },
  jsonc: { parse: parseJSONC, stringify: stringifyJSONC, surgical: true },
  json5: { parse: parseJSON5, stringify: stringifyJSON5, surgical: false },
  yaml: { parse: parseYAML, stringify: stringifyYAML, surgical: false },
  toml: { parse: parseTOML, stringify: stringifyTOML, surgical: false },
} as const satisfies Record<ConfigFormat, ConfigLanguage>;

const extensionFormats = {
  ".json": "json",
  ".jsonc": "jsonc",
  ".json5": "json5",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".toml": "toml",
} as const satisfies Record<string, ConfigFormat>;

export function isConfigFormat(value: string): value is ConfigFormat {
  return value in configLanguages;
}

/**
 * `undefined` is a real answer: a path can name an extension this module has
 * no language for, and callers say what to do about it rather than receiving
 * a format picked at random.
 */
export function getConfigFormat(filepath: string): ConfigFormat | undefined {
  const extension = extname(filepath).toLowerCase();

  return extension in extensionFormats
    ? extensionFormats[extension as keyof typeof extensionFormats]
    : undefined;
}
