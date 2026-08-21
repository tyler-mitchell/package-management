import type { StorageValue } from "unstorage";

export function isStorageValue(input: unknown): input is StorageValue {
  return (
    input === null ||
    typeof input === "string" ||
    typeof input === "number" ||
    typeof input === "boolean" ||
    typeof input === "object"
  );
}
