import { getCallSites } from "node:util";
import { fileURLToPath } from "node:url";
import { isAbsolute } from "pathe";

/**
 * Node caps this at 200. It is a request, not a truncation risk: unlike
 * `error.stack`, `getCallSites` ignores `Error.stackTraceLimit`, so a host that
 * lowers or zeroes that limit cannot shorten what is returned here.
 */
const MAX_FRAMES = 200;

type CallSite = ReturnType<typeof getCallSites>[number];

export interface CallerLocationOptions {
  /**
   * The calling module's own URL — pass `import.meta.url`.
   *
   * This is the reliable answer and skips stack inspection entirely. A module
   * can always name itself; nothing can ask the runtime who called it, which is
   * why the fallback below has to exist at all.
   */
  from?: string | URL;

  /**
   * Name of the public entry point whose caller is wanted, used only when
   * `from` is absent.
   */
  boundaryFunctionName?: string;

  /**
   * Module URLs to treat as this library's own when walking the stack.
   *
   * In a published bundle every internal frame shares one script, so this is
   * redundant there; unbundled, each internal module is its own script and has
   * to say so.
   */
  internalScripts?: string[];
}

/**
 * The file that called into this library.
 *
 * Prefers `from`. Otherwise reads the call stack through `node:util`'s
 * `getCallSites`, which — unlike parsing `error.stack` — is unaffected by
 * `Error.prepareStackTrace`, is not bounded by `Error.stackTraceLimit`, and
 * reconstructs original locations through source maps.
 */
export function resolveCallerFile(options?: CallerLocationOptions) {
  const { from, boundaryFunctionName, internalScripts = [] } = options ?? {};

  if (from) return toCallerPath(String(from));

  const sites = getCallSites(MAX_FRAMES, { sourceMap: true });

  const scriptName =
    (boundaryFunctionName && frameAfterFunction(sites, boundaryFunctionName)) ||
    firstForeignFrame(sites, [OWN_SCRIPT, ...internalScripts]);

  return scriptName ? toFilePath(scriptName) : undefined;
}

const OWN_SCRIPT = import.meta.url;

/**
 * The frame directly above the named entry point.
 *
 * Frames run innermost first, so this finds this library's own entry rather
 * than a same-named function further out in the caller.
 */
function frameAfterFunction(sites: CallSite[], functionName: string) {
  const boundary = sites.findIndex((site) => site.functionName === functionName);

  return boundary === -1 ? undefined : sites[boundary + 1]?.scriptName;
}

/**
 * The first frame belonging to a script this library does not own.
 *
 * This is what survives minification: a published bundle is one script, so
 * every internal frame shares it and the first foreign script is the consumer
 * — no function name has to survive for it to work.
 *
 * Comparison is by resolved path so that a `file://` frame and a plain-path
 * frame for the same module still match, which they do not as raw strings.
 */
function firstForeignFrame(sites: CallSite[], internalScripts: string[]) {
  const internal = new Set(internalScripts.map(toFilePath));

  return sites.find(
    (site) =>
      // Frames from `node:` internals and evaluated code name no file, so they
      // are never the caller's location however far out they appear.
      isFileScript(site.scriptName) &&
      !internal.has(toFilePath(site.scriptName))
  )?.scriptName;
}

const isFileScript = (script: string | undefined): script is string =>
  Boolean(script) && (script!.startsWith("file:") || isAbsolute(script!));

/** ES module frames report their script as a `file://` URL. */
const toFilePath = (script: string) =>
  script.startsWith("file:") ? fileURLToPath(script) : script;

/**
 * `from` names a module, so it is a `file:` URL or an absolute path and
 * nothing else.
 *
 * Without this check a `http:`, `data:` or `node:` specifier was returned as
 * though it were a path — `"http://host/x.js"` became `"http:/host/x.js"` and
 * then served as a base directory for anything joined onto it.
 */
function toCallerPath(from: string) {
  if (from.startsWith("file:")) return fileURLToPath(from);

  if (isAbsolute(from)) return from;

  throw new Error(
    `\`from\` must be a file: URL or an absolute path, received ${JSON.stringify(from)}. Pass \`import.meta.url\`.`
  );
}
