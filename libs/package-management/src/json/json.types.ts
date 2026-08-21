import type { Prettify, RequireExactlyOne } from "..";

export type JsonSourceInputType = keyof JsonSourceInput;

export interface JsonSourceData<$json extends object = object> {
  text: string;
  data: $json;
}

export type JsonSourceInput<data extends object = object> = Prettify<
  RequireExactlyOne<{
    data?: data;
    filepath?: string;
    text?: string;
  }>
>;
