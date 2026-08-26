import { afterAll, beforeAll, describe, expect, it } from "vitest";
import os from "node:os";
import process from "node:process";
import { join } from "pathe";
import { readFileSync } from "node:fs";
import { modifyJSON, modifyJSONFile } from "./json";
import { defineFileSystemStorage } from "@/storage";

// A temp directory, not somewhere under `src`: the fixture storage clears and
// then recursively deletes whatever base it is pointed at.
const fixturesDir = join(os.tmpdir(), `package-management-json-${process.pid}`);

const fixtureData = {
  "simple-json.fixture.json": { a: 1, b: 2 },
  "package-json.fixture.json": {
    name: "foo",
    version: "1.0.0",
    dependencies: { bar: "1.0.0" },
  },
  "nested-json.fixture.json": { a: { deeply: { nested: { value: "foo" } } } },
};

const fixtureFs = defineFileSystemStorage({
  base: fixturesDir,
  initial: fixtureData,
});

beforeAll(async () => {
  await fixtureFs.initializeFs();
});

afterAll(async () => {
  await fixtureFs.deleteFileSystem();
});

describe("modifyJSON", () => {
  it("modifies a value in place", () => {
    const { data } = modifyJSON({
      json: { data: fixtureData["simple-json.fixture.json"] },
      edits: [{ path: "a", value: 3 }],
    });

    expect(data?.data).toEqual({ a: 3, b: 2 });
  });

  it("modifies a nested value by dot path", () => {
    const { data } = modifyJSON({
      json: { data: fixtureData["package-json.fixture.json"] },
      edits: [{ path: "dependencies.bar", value: "2.0.0" }],
    });

    expect(data?.data).toMatchObject({ dependencies: { bar: "2.0.0" } });
  });

  it("applies batched edits that create the same missing parent", () => {
    const { data, error } = modifyJSON({
      json: { text: `{"name":"pkg"}` },
      edits: [
        { path: "scripts.build", value: "tsc" },
        { path: "scripts.test", value: "vitest" },
      ],
    });

    expect(error).toBeUndefined();

    // Computing both edits against the original text made each synthesize its
    // own `scripts` object, emitting a duplicate key and losing the first edit.
    expect(data?.data).toEqual({
      name: "pkg",
      scripts: { build: "tsc", test: "vitest" },
    });
  });

  it("applies successive edits to the same key", () => {
    const { data, error } = modifyJSON({
      json: { text: `{"version":"1.0.0"}` },
      edits: [
        { path: "version", value: "2.0.0" },
        { path: "version", value: "3.0.0" },
      ],
    });

    // Independently computed edits to one key are rejected as overlapping.
    expect(error).toBeUndefined();

    expect(data?.data).toEqual({ version: "3.0.0" });
  });

  it("edits a document containing comments", () => {
    const { data, error } = modifyJSON({
      json: { text: `{\n  // a comment\n  "strict": true\n}` },
      edits: [{ path: "strict", value: false }],
    });

    expect(error).toBeUndefined();

    expect(data?.data).toEqual({ strict: false });

    expect(data?.text).toContain("// a comment");
  });

  it("treats array path segments literally", () => {
    const { data } = modifyJSON({
      json: { text: `{"exports":{"./index.js":"x"}}` },
      edits: [{ path: ["exports", "./index.js"], value: "y" }],
    });

    // Splitting a spelled-out segment makes any key containing the separator
    // unreachable.
    expect(data?.data).toEqual({ exports: { "./index.js": "y" } });
  });

  it("addresses an array element by index", () => {
    const { data, error } = modifyJSON({
      json: { text: `{"files":["a","b"]}` },
      edits: [{ path: "files.1", value: "c" }],
    });

    expect(error).toBeUndefined();

    expect(data?.data).toEqual({ files: ["a", "c"] });
  });

  it("honours pathSeparator: false", () => {
    const { data } = modifyJSON({
      json: { text: `{"a.b":1}` },
      edits: [{ path: "a.b", value: 2, options: { pathSeparator: false } }],
    });

    expect(data?.data).toEqual({ "a.b": 2 });
  });

  it("honours a custom pathSeparator from the default options", () => {
    const { data } = modifyJSON({
      json: { text: `{"a":{"b":1}}` },
      defaultEditOptions: { pathSeparator: "/" },
      edits: [{ path: "a/b", value: 2 }],
    });

    expect(data?.data).toEqual({ a: { b: 2 } });
  });

  it("accepts the edit-map form", () => {
    const { data } = modifyJSON({
      json: { text: `{"a":1}` },
      edits: { "b.c": { value: 2 } },
    });

    expect(data?.data).toEqual({ a: 1, b: { c: 2 } });
  });

  it("reports an absent source as an error rather than throwing", () => {
    const { error } = modifyJSON({
      json: {} as never,
      edits: [{ path: "a", value: 1 }],
    });

    expect(error).toBeInstanceOf(Error);
  });
});

describe("modifyJSONFile", () => {
  it("writes the edit to disk by default", () => {
    const filepath = fixtureFs.getFilePath("nested-json.fixture.json");

    const { data, error } = modifyJSONFile(filepath, [
      { path: "a.deeply.nested.value", value: "bar" },
    ]);

    expect(error).toBeUndefined();

    expect(data?.data).toEqual({
      a: { deeply: { nested: { value: "bar" } } },
    });

    expect(readFileSync(filepath, "utf-8")).toBe(data?.text);
  });

  it("leaves the file untouched until commit when autoCommit is off", () => {
    const filepath = fixtureFs.getFilePath("simple-json.fixture.json");

    const before = readFileSync(filepath, "utf-8");

    const { data } = modifyJSONFile(
      filepath,
      [{ path: "a", value: 99 }],
      { autoCommit: false }
    );

    expect(readFileSync(filepath, "utf-8")).toBe(before);

    data?.commit();

    expect(readFileSync(filepath, "utf-8")).toBe(data?.json.text);
  });

  it("reports a missing file as an error rather than throwing", () => {
    const { error } = modifyJSONFile(join(fixturesDir, "absent.json"), [
      { path: "a", value: 1 },
    ]);

    expect(error).toBeInstanceOf(Error);
  });
});
