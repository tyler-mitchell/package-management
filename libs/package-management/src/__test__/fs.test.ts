import { afterAll, describe, expect, it } from "vitest";
import { readFileSync, rmSync } from "node:fs";
import os from "node:os";
import process from "node:process";
import { join } from "pathe";
import { createFile } from "@/fs/createFile";
import { readFile, readFileSafely } from "@/fs/readFile";
import { isWritable } from "@/fs/isFileWritable";
import { getFilenameFromPath } from "@/path/getFilenameFromPath";
import { gitignore } from "@/gitignore";

const scratchRoot = join(os.tmpdir(), `package-management-fs-${process.pid}`);

afterAll(() => {
  rmSync(scratchRoot, { recursive: true, force: true });
});

describe("createFile", () => {
  it("writes a file into an existing directory", () => {
    const target = join(scratchRoot, "top-level.txt");

    createFile(target, "contents");

    expect(readFileSync(target, "utf-8")).toBe("contents");
  });

  it("creates every missing parent directory", () => {
    const target = join(scratchRoot, "deeply", "nested", "file.txt");

    // A non-recursive mkdir only works when the immediate parent's own parent
    // already exists, which is rarely true for a path being created.
    createFile(target, "nested contents");

    expect(readFileSync(target, "utf-8")).toBe("nested contents");
  });

  it("honours an explicit encoding passed as a string", () => {
    const target = join(scratchRoot, "encoded.txt");

    createFile(target, "encoded", "utf-8");

    expect(readFileSync(target, "utf-8")).toBe("encoded");
  });
});

describe("readFile", () => {
  it("reads a file back as text", () => {
    const target = join(scratchRoot, "readable.txt");

    createFile(target, "contents");

    expect(readFile(target)).toBe("contents");
  });

  it("throws for a file that does not exist", () => {
    expect(() => readFile(join(scratchRoot, "absent.txt"))).toThrow();
  });
});

describe("readFileSafely", () => {
  it("reads a file that exists", () => {
    const target = join(scratchRoot, "safely.txt");

    createFile(target, "contents");

    expect(readFileSafely(target)).toBe("contents");
  });

  it("answers undefined for a file that does not exist", () => {
    // A config a tool has never written is absent, not empty, and a caller
    // seeding one should not have to catch a throw to learn that.
    expect(readFileSafely(join(scratchRoot, "absent.txt"))).toBeUndefined();
  });

  it("distinguishes an absent file from an empty one", () => {
    const target = join(scratchRoot, "empty.txt");

    createFile(target, "");

    expect(readFileSafely(target)).toBe("");
  });
});

describe("isWritable", () => {
  it("reports an existing file as writable", () => {
    const target = join(scratchRoot, "writable.txt");

    createFile(target, "writable");

    expect(isWritable(target)).toBe(true);
  });

  it("reports a path that does not exist as not writable", () => {
    expect(isWritable(join(scratchRoot, "absent.txt"))).toBe(false);
  });
});

describe("gitignore", () => {
  it("reports an empty rule set when there is no .gitignore", () => {
    // `project()` builds one of these for every project, so a project without
    // a .gitignore threw ENOENT from a plain property read.
    const absent = join(scratchRoot, "no-gitignore", ".gitignore");

    expect(() => gitignore(absent).patterns).not.toThrow();
    expect(gitignore(absent).patterns).toEqual([]);
  });

  it("parses the patterns of a file that exists", () => {
    const target = join(scratchRoot, "with-gitignore", ".gitignore");

    createFile(target, "node_modules\ndist\n");

    expect(gitignore(target).patterns).toEqual(
      expect.arrayContaining(["node_modules", "dist"])
    );
  });
});

describe("getFilenameFromPath", () => {
  it("returns the base name without its extension", () => {
    expect(getFilenameFromPath("/a/b/component.ts")).toBe("component");
  });

  it("keeps interior dots and drops only the final extension", () => {
    expect(getFilenameFromPath("/a/b/component.test.ts")).toBe("component.test");
  });
});
