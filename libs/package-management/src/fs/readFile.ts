import { existsSync, readFileSync } from "node:fs";

export interface ReadFileOptions {
  /** @default "utf-8" */
  encoding?: BufferEncoding;
}

export function readFile(filePath: string, options?: ReadFileOptions): string {
  return readFileSync(filePath, options?.encoding ?? "utf-8");
}

/**
 * `undefined` is a real answer: a config a tool has never written yet is
 * absent rather than empty, and callers seeding one say so themselves
 * instead of catching a throw to find out.
 */
export function readFileSafely(
  filePath: string,
  options?: ReadFileOptions
): string | undefined {
  return existsSync(filePath) ? readFile(filePath, options) : undefined;
}
