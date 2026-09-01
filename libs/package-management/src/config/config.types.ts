import type { Prettify, RequireExactlyOne } from "..";

/**
 * The configuration languages a project actually ships: `package.json` and
 * `tsconfig.json`, `.prettierrc.json5`, CI and Compose YAML, and the TOML
 * that Cargo, Codex, and Ruff read.
 */
export type ConfigFormat = "json" | "jsonc" | "json5" | "yaml" | "toml";

export type ConfigSourceInputType = keyof ConfigSourceInput;

export interface ConfigSourceData<$config extends object = object> {
  text: string;
  data: $config;
}

export type ConfigSourceInput<data extends object = object> = Prettify<
  RequireExactlyOne<{
    data?: data;
    filepath?: string;
    text?: string;
  }> & {
    /**
     * Inferred from a `filepath`'s extension. Required for `text` and `data`,
     * which carry no extension to read it from.
     */
    format?: ConfigFormat;
  }
>;
