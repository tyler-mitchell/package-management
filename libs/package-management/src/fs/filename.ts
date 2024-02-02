/* eslint-disable unicorn/error-message */
import { findCallerStackFrame } from "./stack-frame";

interface StackFrameOptions {
  rootFunctionName?: string;
}

export const _filename = (options?: StackFrameOptions) => {
  const { filePath } =
    findCallerStackFrame({ error: new Error(), ...options }) ?? {};
  return filePath;
};

export const _dirname = (options?: StackFrameOptions) => {
  const { dirPath } =
    findCallerStackFrame({ error: new Error(), ...options }) ?? {};
  return dirPath;
};
