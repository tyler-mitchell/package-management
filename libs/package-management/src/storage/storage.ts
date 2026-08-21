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
import type { Cast, StringLiteral, ValueKeyOf } from "@/types";
import { isStorageValue } from "./storage.utils";
import { rm } from "node:fs/promises";

export const storage = createStorage({ driver: defineMemoryDriver() });

export const tempFileSystem = defineFileSystemStorage({
  base: join(os.tmpdir(), ".package-manager"),
});

export type FileSystemEntriesDefinition<$filepath extends string = string> = {
  [K in $filepath]:
    | StorageValue
    | (<$file_data extends StorageValue>() => {
        file: $file_data;
        options?: TransactionOptions;
        serialize?: (file_data: $file_data) => string;
        deserialize?: (file_content: string) => $file_data;
      });
};

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
type GetFileSystemItem<$filepath, $fs_def> = ValueKeyOf<$fs_def, $filepath> // prettier-ignore

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
    data: any;
    read: () => Promise<any>;
  }>;

  readFile: (filepath: $path_completion) => Promise<string>;

  getFilePath: <$filepath extends $path_completion>(
    key: $filepath
  ) => Promise<string>;

  restoreFs(snapshot: Snapshot, base?: string): Promise<void>;

  snapshotFs: (base?: string) => Promise<Snapshot<string>>;

  initializeFs: (newInitial?: FileSystemEntriesDefinition) => Promise<void>;

  removeAllFiles(base?: string, opts?: TransactionOptions): Promise<void>;

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

export function defineFileSystemEntries<
  const $fs_def extends FileSystemEntriesDefinition,
>(definition: $fs_def): FileSystemEntriesData<$fs_def> {
  const fileSystemEntries = Object.entries(definition)
    .map(([k, v]) => {
      if (v instanceof Function) {
        const {
          file,
          options,
          serialize = (input: any) => JSON.stringify(input),
          deserialize = (input: string) => {
            try { return JSON.parse(input) } catch {  return input } // prettier-ignore
          },
        } = v();
        return {
          key: k,
          value: serialize(file),
          options,
          serialize,
          deserialize,
        };
      }

      if (isStorageValue(v)) {
        return {
          key: k,
          value: JSON.stringify(v),
        };
      }

      return undefined;
    })
    .filter((v) => v !== undefined);

  const resolved: FileSystemEntriesData = {
    definition,
    fileSystemEntries,
  };

  return resolved as any;
}

type ExtractFsEntriesDef<$fs_def> = Cast<$fs_def, FileSystemEntriesDefinition>;

export function defineFileSystemStorage<
  const $fs_storage_def extends DefineFileSystemOptions = DefineFileSystemOptions, // prettier-ignore
  $fs_def extends $fs_storage_def['initial'] = $fs_storage_def['initial'], // prettier-ignore
>(
  options: $fs_storage_def
): $fs_storage_def["initial"] extends undefined
  ? FileSystemStorage
  : {
      definition: $fs_storage_def;
      initialize: () => Promise<FileSystemStorage<$fs_def>>;
    } {
  const { base: root, initial, ...storageOptions } = options;

  let initialFileEntriesData = defineFileSystemEntries(initial ?? {});

  const storage = createStorage({
    driver: defineFsLiteDriver({ base: root, ...storageOptions }),
  });

  const fileStorage: FileSystemStorage = {
    createFile: async (key, data) => {
      await storage.setItem(key, data);
      return {
        key,
        filepath: join(root, key),
        get: async () => storage.getItem(key),
        update: async (data: string) => storage.setItem(key, data),
      };
    },
    async getFilePath(key) {
      return (await this.getFile(key)).filepath;
    },
    getFile: async (key) => {
      const storageData = (await storage.getItem(key)) as any;
      return {
        key,
        filepath: join(root, key),
        data: storageData,
        read: async () => (await storage.getItemRaw(key))?.toString(),
      };
    },
    async readFile(key) {
      const { read } = await this.getFile(key);
      const content = await read();
      return content;
    },

    snapshotFs: async (base = root) => {
      return snapshot(storage, base);
    },
    restoreFs: async (snapshot) => {
      return restoreSnapshot(storage, snapshot);
    },

    initializeFs: async (override) => {
      if (override) {
        initialFileEntriesData = defineFileSystemEntries(override);
      }
      await storage.clear();
      return storage.setItems(initialFileEntriesData.fileSystemEntries);
    },

    defineFileSystemEntries,

    removeAllFiles: storage.clear,

    async deleteFileSystem() {
      await this.removeAllFiles();
      await storage.unmount(root, true);
      await rm(root, { recursive: true, force: true });
    },

    storage,

    meta: {
      fileEntriesData: initialFileEntriesData,
    },
  };

  if (initial) {
    return {
      initialize: async () => {
        await fileStorage.initializeFs(initial);
        return fileStorage;
      },
    } as any;
  }

  return fileStorage as any;
}
