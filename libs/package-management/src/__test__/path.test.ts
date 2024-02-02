import { describe, expect, it } from "vitest";
import { getPath } from "../path/getPath";
import { _filename } from "@/fs";
import { basename, relative } from "pathe";
import os from "node:os";

const CURRENT_FILE_PATH = __filename;

const CURRENT_DIR_PATH = __dirname;

describe.only("path tests", () => {
  it("should return the path to the current file: <current_file>", () => {
    const filePath1 = getPath({ to: ["<current_file>"] });

    expect(filePath1).toBe(CURRENT_FILE_PATH);
  });

  it.only("should return the path to the current folder: <current_folder>", () => {
    const dirname = getPath({ to: ["<current_folder>"] });
    expect(dirname).toBe(CURRENT_DIR_PATH);
  });

  it("should return the path to the current file by defining a subpath: <current_folder>/[subpath]", () => {
    const filePath = getPath({
      to: ["<current_folder>", basename(CURRENT_FILE_PATH)],
    })!;

    expect(filePath).toBe(CURRENT_FILE_PATH);
  });

  it("relative path should work", () => {
    const filePath = getPath({
      to: ["<user_tmpdir>"],
      startingFrom: ["<current_file>"],
    });

    console.log(filePath);

    expect(filePath).toBe(relative(CURRENT_FILE_PATH, os.tmpdir()));
  });
});
