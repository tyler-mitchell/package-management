import ErrorStackParser, { type StackFrame } from "error-stack-parser";
import { basename, dirname, normalize, relative } from "pathe";
import process from "node:process";
import { win32, posix } from "node:path";
import { getArrayItemAtOffset, isMatching } from "@/utils";

export interface StackFrameOptions {
  rootFunctionName?: string;
}

export type FindStackFrameOptions = StackFrameOptions & {
  error: Error;
  startFrom?: "top" | "bottom";
};

export function findCallerStackFrame(options: FindStackFrameOptions) {
  return findErrorStackFrame(options, (frame) => frame.isParentOfRootFunction);
}

export function findErrorStackFrame(
  options: FindStackFrameOptions,
  find: (frame: ParsedFrame) => boolean
) {
  return getErrorStackFrames(options, find)[0];
}

export function getErrorStackFrames(
  options: FindStackFrameOptions,
  filter?: (frame: ParsedFrame) => boolean
) {
  const { error, rootFunctionName, startFrom = "top" } = options;

  const frames =
    startFrom === "bottom"
      ? ErrorStackParser.parse(error).reverse()
      : ErrorStackParser.parse(error);

  // const frames = ErrorStackParser.parse(error);

  const { parsedFrames } = frames.reduce(
    (acc, frame, index) => {
      const parsed = parseFrame({
        frame,
        index,
        rootFunctionName,
        frames,
      });

      const isValid = filter ? filter(parsed) : true;

      if (isValid) {
        acc.parsedFrames.push(parsed);
      }

      return acc;
    },
    { parsedFrames: [] } as { parsedFrames: ParsedFrame[] }
  );

  return parsedFrames ?? [];
}

type ParsedFrame = ReturnType<typeof parseFrame>;

function parseFrame(options: {
  frame: StackFrame;
  index?: number;
  debug?: boolean;
  rootFunctionName?: string;
  frames?: StackFrame[];
  cwd?: string;
}) {
  const { frame, frames, index, rootFunctionName, cwd, debug } = options ?? {};

  const functionName = parseFunctionName(frame.functionName);

  const isRootFunction = isMatching(functionName, rootFunctionName);

  const beforeFrameFunctionName = parseFunctionName(
    getArrayItemAtOffset(frames, index, -1)?.functionName
  );

  const isParentOfRootFunction = isMatching(
    beforeFrameFunctionName,
    rootFunctionName
  );

  const fileData = frame.fileName
    ? getFilePathData({ filepath: frame.fileName, cwd })
    : undefined;

  const { isFileInCwd: isFrameInScope, ...restFileData } = fileData ?? {};

  const data = {
    ...restFileData,
    functionName,
    source: frame.source,
    sourceFunctionName: frame.functionName,
    isFrameInScope,
    place: placeFormatter(index, frames?.length),
    isRootFunction,
    isParentOfRootFunction,
    rootFunctionName,
  };

  debug && console.log(data);

  return data;
}

function getFilePathData({
  filepath,
  cwd,
}: {
  filepath: string;
  cwd?: string;
}) {
  const workingDir = cwd ?? process.cwd();
  const filePath = normalize(filepath);
  const fileBasename = basename(filePath);
  const dirPath = dirname(filePath);
  const dirBasename = basename(dirPath);
  const relativeFilePath = relative(workingDir, filePath);
  const relativeDirPath = dirname(relativeFilePath);
  const isFileInCwd = filePath.startsWith(workingDir);

  return {
    filePath,
    dirPath,
    relativeFilePath,
    relativeDirPath,
    fileBasename,
    dirBasename,
    isFileInCwd,
  };
}

function parseFunctionName(functionName: string | undefined) {
  if (!functionName) return undefined;
  // Example: "Module.functionName" => "functionName"
  return removeStart(functionName, "Module.");
}

function removeStart(input: string, value: string) {
  return input.startsWith(value) ? input.slice(value.length) : input;
}

function placeFormatter(index?: number, total?: number) {
  if (!index || !total) return undefined;
  return [index, total].join("/");
}

function relativeToCwd<T extends string | undefined>(
  filepath: T,
  cwd?: string
) {
  if (!filepath) return undefined;

  const to = normalize(filepath);
  const from = normalize(cwd ?? process.cwd());
  const relativePath = relative(from, to);

  return {
    path: relativePath,
    inScope: to.startsWith(from),
    absolutePaths: {
      path: filepath,
      unix: posix.normalize(relativePath),
      win32: win32.normalize(relativePath),
    },
  };
}
