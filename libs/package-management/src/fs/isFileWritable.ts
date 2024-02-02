import { accessSync, constants } from "node:fs";

export function isWritable(filename: string): boolean {
  try {
    accessSync(filename, constants.W_OK);
    return true;
  } catch (e) {
    return false;
  }
}
