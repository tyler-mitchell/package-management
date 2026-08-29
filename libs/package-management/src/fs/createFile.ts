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
    // Without `recursive`, writing to `a/b/c.txt` fails whenever `a` is also
    // missing, which is the usual case for a path being created.
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(filePath, data, writeFileOptions);
}
