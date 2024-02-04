import { createStorage, prefixStorage } from "unstorage";
import defineMemoryDriver from "unstorage/drivers/memory";
import defineFsLiteDriver from "unstorage/drivers/fs-lite";
import os from "node:os";
import { join } from "pathe";

export const storage = createStorage({ driver: defineMemoryDriver() });

const tempDir = join(os.tmpdir(), ".package-manager");

const tempFileStorage = createStorage({
  driver: defineFsLiteDriver({ base: tempDir }),
});

export const tempFileSystem = {
  ...tempFileStorage,
  createFile: async (key: string, data: string) => {
    await tempFileStorage.setItem(key, data);
    return {
      key,
      filepath: join(tempDir, key),
      get: async () => tempFileStorage.getItem(key),
      update: async (data: string) => tempFileStorage.setItem(key, data),
    };
  },
  getFile: async (key: string) => {
    const data = await tempFileStorage.getItem(key);
    return {
      key,
      filepath: join(tempDir, key),
      data,
    };
  },
};
