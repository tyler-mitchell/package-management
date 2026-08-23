import { afterAll, describe, expect, it } from "vitest";
import { modifyJSON, modifyJSONFile } from "./json";
import { getPath } from "@/path";
import { defineFileSystemStorage } from "@/storage";

const fixturesDir = getPath(["<package_folder>/src", "json/fixtures"]);

const fixtureData = {
  "simple-json.fixture.json": {
    a: 1,
    b: 2,
  },
  "package-json.fixture.json": {
    name: "foo",
    version: "1.0.0",
    dependencies: {
      bar: "1.0.0",
    },
  },
};

const fixtureFs = await defineFileSystemStorage({
  base: fixturesDir,
  initial: fixtureData,
}).initialize();

describe("json", () => {
  afterAll(async () => {
    await fixtureFs.deleteFileSystem();
  });

  it("should modify json data", () => {
    const { data: simpleJson } = modifyJSON({
      defaultEditOptions: {},
      json: {
        data: fixtureData["simple-json.fixture.json"],
      },
      edits: [{ path: "a", value: "3", options: {} }],
    });

    expect(simpleJson?.data).toMatchInlineSnapshot(`
      {
        "a": "3",
        "b": 2,
      }
    `);

    const { data: packageJson } = modifyJSON({
      defaultEditOptions: {},
      json: {
        data: fixtureData["package-json.fixture.json"],
      },
      edits: [
        { path: "dependencies.bar", value: "[UPDATED DEPENDENCY VERSION]" },
      ],
    });

    expect(packageJson?.data).toMatchInlineSnapshot(`
      {
        "dependencies": {
          "bar": "[UPDATED DEPENDENCY VERSION]",
        },
        "name": "foo",
        "version": "1.0.0",
      }
    `);
  });

  it("should modify json file", async () => {
    const filepath = await fixtureFs.getFilePath("nested-json.fixture.json");

    const { data: json } = modifyJSONFile(filepath, [
      { path: "a.deeply.nested.value", value: "bar" },
    ]);

    const fixtureText = await fixtureFs.readFile("nested-json.fixture.json");

    expect(fixtureText).toBe(json?.text);
  });
});
