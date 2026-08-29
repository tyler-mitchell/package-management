/* eslint-disable antfu/generic-spacing */
import {
  createStorage,
  restoreSnapshot,
  snapshot,
  type Snapshot,
  type Storage,
  type StorageValue,
  type TransactionOptions,
} from "unstorage";
import defineMemoryDriver from "unstorage/drivers/memory";
import defineFsLiteDriver, {
  type FSStorageOptions,
} from "unstorage/drivers/fs-lite";
import os from "node:os";
import { join } from "pathe";
import type { Cast, StringLiteral } from "@/types";
import { isStorageValue } from "./storage.utils";
import { rm } from "node:fs/promises";

export const storage = createStorage({ driver: defineMemoryDriver() });

export const tempFileSystem = defineFileSystemStorage({
  base: join(os.tmpdir(), ".package-manager"),
});

export type FileSystemEntriesDefinition<$filepath extends string = string> = {
  [K in $filepath]: StorageValue | (() => FileSystemEntryDefinition);
};

interface FileSystemEntryDefinition<$file_data extends StorageValue = StorageValue> {
  file: $file_data;
  options?: TransactionOptions;
}

interface FileSystemEntry<$key extends string = string> {
  key: $key;
  value: string;
  options?: TransactionOptions;
}

type DefineFileSystemOptions<$filepath extends string = string> = {
  base: string;
  initial?: FileSystemEntriesDefinition<$filepath>;
} & Omit<FSStorageOptions, "base">;

type FileSystemPath<$fs_def> = Extract<keyof $fs_def, string> // prettier-ignore
type FileSystemPathCompletion<$fs_def> = StringLiteral<FileSystemPath<$fs_def>> // prettier-ignore

interface FileSystemStorage<
  $fs_def extends FileSystemEntriesDefinition | undefined = FileSystemEntriesDefinition, // prettier-ignore
  $path_completion extends FileSystemPathCompletion<$fs_def> = FileSystemPathCompletion<$fs_def>, // prettier-ignore
> {
  meta: {
    fileEntriesData: FileSystemEntriesData<$fs_def>;
  };

  createFile: (
    key: string,
    data: string
  ) => Promise<{
    key: string;
    filepath: string;
    get: () => Promise<StorageValue>;
    update: (data: string) => Promise<void>;
  }>;

  getFile: (filepath: $path_completion) => Promise<{
    key: string;
    filepath: string;
    data: StorageValue;
    read: () => Promise<string | undefined>;
  }>;

  /** Resolves to `undefined` when the file does not exist. */
  readFile: (filepath: $path_completion) => Promise<string | undefined>;

  /** The location a key maps to on disk, whether or not anything is there. */
  getFilePath: (key: $path_completion) => string;

  /** `base` is a storage key prefix, not a filesystem path. */
  restoreFs(snapshot: Snapshot, base?: string): Promise<void>;

  /** `base` is a storage key prefix, not a filesystem path. */
  snapshotFs: (base?: string) => Promise<Snapshot<string>>;

  /** Replaces the entries this storage owns, leaving other files in place. */
  initializeFs: (newInitial?: FileSystemEntriesDefinition) => Promise<void>;

  removeAllFiles(): Promise<void>;

  /** Removes the base directory and everything under it. */
  deleteFileSystem(): Promise<void>;

  defineFileSystemEntries: typeof defineFileSystemEntries;

  storage: Storage;
}

interface FileSystemEntriesData<
  T extends FileSystemEntriesDefinition | undefined = undefined,
  $fs_def extends ExtractFsEntriesDef<T> = ExtractFsEntriesDef<T>,
> {
  definition: $fs_def;
  fileSystemEntries: FileSystemEntry<FileSystemPath<$fs_def>>[];
}

/**
 * Strings are written verbatim and everything else is JSON encoded, so that a
 * text fixture round-trips as the same text rather than as a quoted string.
 */
const encodeEntry = (value: StorageValue) =>
  typeof value === "string" ? value : JSON.stringify(value);

export function defineFileSystemEntries<
  const $fs_def extends FileSystemEntriesDefinition,
>(definition: $fs_def): FileSystemEntriesData<$fs_def> {
  const fileSystemEntries = Object.entries(definition).map(([key, value]) => {
    // `typeof` rather than `instanceof`, which is false for a function created
    // in another realm such as a worker or `vm` context.
    if (typeof value === "function") {
      const { file, options } = value();

      return { key, value: encodeEntry(file), options };
    }

    if (!isStorageValue(value)) {
      throw new Error(
        `Cannot store a ${typeof value} at "${key}": file system entries must be a storage value or a function returning one.`
      );
    }

    return { key, value: encodeEntry(value) };
  });

  const resolved: FileSystemEntriesData = {
    definition,
    fileSystemEntries,
  };

  return resolved as unknown as FileSystemEntriesData<$fs_def>;
}

type ExtractFsEntriesDef<$fs_def> = Cast<$fs_def, FileSystemEntriesDefinition>;

/**
 * Maps a storage key to its location on disk.
 *
 * `unstorage` normalizes path separators to `:` and the `fs-lite` driver maps
 * them back to directory separators, so joining the raw key would produce a
 * path such as `root/dir:deep.txt` for a file actually written to
 * `root/dir/deep.txt`.
 */
const keyToFilePath = (root: string, key: string) =>
  join(root, ...key.split(/[:/\\]+/).filter(Boolean));

export function defineFileSystemStorage<
  const $fs_storage_def extends DefineFileSystemOptions = DefineFileSystemOptions, // prettier-ignore
  $fs_def extends $fs_storage_def['initial'] = $fs_storage_def['initial'], // prettier-ignore
>(options: $fs_storage_def): FileSystemStorage<ExtractFsEntriesDef<$fs_def>> {
  const { base: root, initial, ...storageOptions } = options;

  let entriesData = defineFileSystemEntries(initial ?? {});

  const storage = createStorage({
    driver: defineFsLiteDriver({ base: root, ...storageOptions }),
  });

  const getFilePath = (key: string) => keyToFilePath(root, key);

  const getFile: FileSystemStorage["getFile"] = async (key) => ({
    key,
    filepath: getFilePath(key),
    data: await storage.getItem(key),
    // `getItemRaw` resolves to null for a missing file rather than throwing.
    read: async () => (await storage.getItemRaw(key))?.toString(),
  });

  const removeAllFiles = async () => storage.clear();

  const fileStorage: FileSystemStorage = {
    createFile: async (key, data) => {
      await storage.setItem(key, data);

      return {
        key,
        filepath: getFilePath(key),
        get: async () => storage.getItem(key),
        update: async (data: string) => storage.setItem(key, data),
      };
    },

    getFilePath,

    getFile,

    readFile: async (key) => (await getFile(key)).read(),

    // `base` is a key prefix. Defaulting it to the filesystem root would match
    // no key at all and silently report an empty filesystem.
    snapshotFs: async (base = "") => snapshot(storage, base),

    restoreFs: async (snapshot, base) =>
      restoreSnapshot(storage, snapshot, base),

    initializeFs: async (override) => {
      // Only the keys this storage put there are removed. `storage.clear()`
      // deletes the entire base directory, which destroys files the caller
      // already had there.
      const previousKeys = entriesData.fileSystemEntries.map(({ key }) => key);

      if (override) entriesData = defineFileSystemEntries(override);

      await Promise.all(previousKeys.map((key) => storage.removeItem(key)));

      await storage.setItems(entriesData.fileSystemEntries);
    },

    defineFileSystemEntries,

    removeAllFiles,

    async deleteFileSystem() {
      await removeAllFiles();
      // `unmount(root)` is a no-op — the driver is mounted at "", never at a
      // filesystem path — so disposing the storage is what releases it.
      await storage.dispose();
      await rm(root, { recursive: true, force: true });
    },

    storage,

    meta: {
      // A getter, so that `initializeFs(override)` is reflected here rather
      // than this reporting whatever the definition was at construction.
      get fileEntriesData() {
        return entriesData;
      },
    },
  };

  return fileStorage as unknown as FileSystemStorage<
    ExtractFsEntriesDef<$fs_def>
  >;
}
