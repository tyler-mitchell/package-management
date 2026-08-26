import { afterEach, describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import process from "node:process";
import { join } from "pathe";
import {
  defineFileSystemEntries,
  defineFileSystemStorage,
  type FileSystemEntriesDefinition,
} from "./storage";

let created = 0;

const roots: string[] = [];

/** A distinct base directory per test, so none of them can interfere. */
function makeFileSystem(initial: FileSystemEntriesDefinition = {}) {
  const base = join(
    os.tmpdir(),
    `package-management-storage-${process.pid}-${created++}`
  );

  roots.push(base);

  return defineFileSystemStorage({ base, initial });
}

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map(async (base) => {
      const fs = defineFileSystemStorage({ base });
      await fs.deleteFileSystem();
    })
  );
});

describe("defineFileSystemEntries", () => {
  it("writes strings verbatim and encodes everything else", () => {
    const { fileSystemEntries } = defineFileSystemEntries({
      "text.txt": "hello",
      "data.json": { a: 1 },
    });

    const byKey = Object.fromEntries(
      fileSystemEntries.map(({ key, value }) => [key, value])
    );

    // A text fixture that round-trips as `"hello"` — with the quotes on disk —
    // is not the fixture the caller wrote.
    expect(byKey["text.txt"]).toBe("hello");
    expect(byKey["data.json"]).toBe(`{"a":1}`);
  });

  it("accepts a factory returning the file and its options", () => {
    const { fileSystemEntries } = defineFileSystemEntries({
      "made.json": () => ({ file: { made: true } }),
    });

    expect(fileSystemEntries[0]?.value).toBe(`{"made":true}`);
  });

  it("names the offending key when a value cannot be stored", () => {
    expect(() =>
      defineFileSystemEntries({ bad: 10n as never })
    ).toThrowError(/bad/);
  });
});

describe("file system storage", () => {
  it("returns a usable storage when no initial entries are given", async () => {
    const fs = makeFileSystem();

    const { filepath } = await fs.createFile("plain.txt", "contents");

    expect(readFileSync(filepath, "utf-8")).toBe("contents");
  });

  it("maps a key to the path the driver actually writes to", async () => {
    const fs = makeFileSystem();

    const { filepath } = await fs.createFile("dir:deep.txt", "x");

    // Keys use `:` as the separator; joining the raw key would name a file
    // called `dir:deep.txt` that does not exist.
    expect(existsSync(filepath)).toBe(true);
    expect(fs.getFilePath("dir:deep.txt")).toBe(filepath);
  });

  it("reads back a file it wrote", async () => {
    const fs = makeFileSystem();

    await fs.createFile("read-me.txt", "the contents");

    await expect(fs.readFile("read-me.txt")).resolves.toBe("the contents");
  });

  it("resolves to undefined for a file that is not there", async () => {
    const fs = makeFileSystem();

    await expect(fs.readFile("absent.txt")).resolves.toBeUndefined();
  });

  it("survives having its methods destructured", async () => {
    const fs = makeFileSystem();

    await fs.createFile("detached.txt", "value");

    // Methods that read `this` break the moment a caller pulls them off.
    const { readFile, getFilePath } = fs;

    await expect(readFile("detached.txt")).resolves.toBe("value");
    expect(getFilePath("detached.txt")).toContain("detached.txt");
  });

  it("snapshots the files it holds", async () => {
    const fs = makeFileSystem();

    await fs.createFile("one.txt", "first");
    await fs.createFile("two.txt", "second");

    // Defaulting the key prefix to the filesystem root matches no key, which
    // reports an empty snapshot indistinguishable from an empty filesystem.
    await expect(fs.snapshotFs()).resolves.toMatchObject({
      "one.txt": "first",
      "two.txt": "second",
    });
  });

  it("restores a snapshot", async () => {
    const fs = makeFileSystem();

    await fs.restoreFs({ "restored.txt": "value" });

    await expect(fs.readFile("restored.txt")).resolves.toBe("value");
  });

  it("initializes the entries it owns without destroying other files", async () => {
    const fs = makeFileSystem({ "owned.json": { a: 1 } });

    await fs.initializeFs();

    await fs.createFile("PRE-EXISTING.txt", "keep me");

    await fs.initializeFs({ "replacement.json": { b: 2 } });

    // Clearing the whole base directory takes the caller's files with it.
    await expect(fs.readFile("PRE-EXISTING.txt")).resolves.toBe("keep me");
    await expect(fs.readFile("replacement.json")).resolves.toBe(`{"b":2}`);
    await expect(fs.readFile("owned.json")).resolves.toBeUndefined();
  });

  it("reports the current entry definition after re-initializing", async () => {
    const fs = makeFileSystem({ "first.json": { a: 1 } });

    await fs.initializeFs({ "second.json": { b: 2 } });

    expect(
      fs.meta.fileEntriesData.fileSystemEntries.map(({ key }) => key)
    ).toEqual(["second.json"]);
  });

  it("removes the base directory when deleted", async () => {
    const fs = makeFileSystem();

    const { filepath } = await fs.createFile("doomed.txt", "x");

    await fs.deleteFileSystem();

    expect(existsSync(filepath)).toBe(false);
  });
});
