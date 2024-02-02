import { filename } from "pathe/utils";

export function getFilenameFromPath(path: string) {
  return filename(path);
}
