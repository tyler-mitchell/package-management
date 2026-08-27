import { dirname } from "pathe";
import { resolveCallerFile, type CallerLocationOptions } from "./call-site";

export type { CallerLocationOptions } from "./call-site";

/**
 * The calling file's absolute path.
 *
 * Pass `from: import.meta.url` wherever the caller can — that is exact in every
 * runtime, while the stack fallback is Node-only.
 */
export const _filename = (options?: CallerLocationOptions) =>
  resolveCallerFile(withOwnScript(options));

/** The directory of the calling file. */
export const _dirname = (options?: CallerLocationOptions) => {
  const filePath = resolveCallerFile(withOwnScript(options));

  return filePath === undefined ? undefined : dirname(filePath);
};

/**
 * This module sits between the caller and the stack reader, so unbundled it is
 * a distinct script that would otherwise look like the caller.
 */
const withOwnScript = (options?: CallerLocationOptions) => ({
  ...options,
  internalScripts: [...(options?.internalScripts ?? []), import.meta.url],
});
