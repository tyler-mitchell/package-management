import type { WriteFileOptions } from "node:fs";

import { existsSync, mkdirSync, writeFileSync } from "node:fs";

import path from "pathe";

export function createFile(
  filePath: string,
  data: string,
  options?: WriteFileOptions
) {
  const { encoding = "utf-8", ...rest } =
    typeof options === "string" ? { encoding: options } : options ?? {};

  const dir = path.dirname(filePath);

  const writeFileOptions = { encoding, ...rest };

  if (!existsSync(dir)) {
    mkdirSync(dir);
  }

  writeFileSync(filePath, data, writeFileOptions);
}
