import { afterAll, beforeAll, describe, expect, it } from "vitest";
import os from "node:os";
import process from "node:process";
import { join } from "pathe";
import { readFileSync } from "node:fs";
import { getConfigFormat, isConfigFormat } from "./config-format";
import { modifyConfig, modifyConfigFile } from "./config";

// A temp directory, not somewhere under `src`: the fixture storage clears and
// then recursively deletes whatever base it is pointed at.
const fixturesDir = join(
  os.tmpdir(),
  `package-management-config-${process.pid}`
);

const tomlFixture = [
  "# the user's own note",
  'model = "gpt-5"',
  "",
  "[mcp_servers.existing]",
  'command = "existing-bin"',
  "",
].join("\n");

const yamlFixture = ["name: ci", "on:", "  push:", "    branches:", "      - main", ""].join(
  "\n"
);

import { defineFileSystemStorage } from "@/storage";

const fixtureFs = defineFileSystemStorage({
  base: fixturesDir,
  initial: {
    "config.fixture.toml": tomlFixture,
    "workflow.fixture.yaml": yamlFixture,
    "tsconfig.fixture.json": '{\n  // keep strict on\n  "strict": true\n}',
  },
});

beforeAll(async () => {
  await fixtureFs.initializeFs();
});

afterAll(async () => {
  await fixtureFs.deleteFileSystem();
});

describe("getConfigFormat", () => {
  it("reads the format from the extension", () => {
    expect(getConfigFormat("a/b/config.toml")).toBe("toml");
    expect(getConfigFormat("workflow.yml")).toBe("yaml");
    expect(getConfigFormat("tsconfig.json")).toBe("json");
    expect(getConfigFormat(".prettierrc.json5")).toBe("json5");
  });

  it("answers undefined for an extension it has no language for", () => {
    expect(getConfigFormat("notes.txt")).toBeUndefined();
  });

  it("guards the format union", () => {
    expect(isConfigFormat("toml")).toBe(true);
    expect(isConfigFormat("ini")).toBe(false);
  });
});

describe("modifyConfig", () => {
  it("edits toml by dot path", () => {
    const { data, error } = modifyConfig({
      config: { text: tomlFixture, format: "toml" },
      edits: [{ path: "mcp_servers.added.command", value: "added-bin" }],
    });

    expect(error).toBeUndefined();

    expect(data?.data).toMatchObject({
      model: "gpt-5",
      mcp_servers: {
        existing: { command: "existing-bin" },
        added: { command: "added-bin" },
      },
    });
  });

  it("edits yaml by dot path", () => {
    const { data, error } = modifyConfig({
      config: { text: yamlFixture, format: "yaml" },
      edits: [{ path: "name", value: "release" }],
    });

    expect(error).toBeUndefined();

    expect(data?.data).toMatchObject({ name: "release" });
  });

  it("addresses a yaml array element by index", () => {
    const { data } = modifyConfig({
      config: { text: yamlFixture, format: "yaml" },
      edits: [{ path: "on.push.branches.0", value: "release" }],
    });

    expect(data?.data).toMatchObject({
      on: { push: { branches: ["release"] } },
    });
  });

  it("keeps comments when the format has a surgical editor", () => {
    const { data } = modifyConfig({
      config: { text: '{\n  // a comment\n  "strict": true\n}', format: "json" },
      edits: [{ path: "strict", value: false }],
    });

    expect(data?.data).toEqual({ strict: false });

    expect(data?.text).toContain("// a comment");
  });

  it("accepts the edit-map form for every format", () => {
    const { data } = modifyConfig({
      config: { text: 'a = 1\n', format: "toml" },
      edits: { b: { value: 2 } },
    });

    expect(data?.data).toEqual({ a: 1, b: 2 });
  });

  it("treats array path segments literally", () => {
    const { data } = modifyConfig({
      config: { text: "", format: "toml" },
      edits: [{ path: ["tool", "my.section"], value: 1 }],
    });

    expect(data?.data).toEqual({ tool: { "my.section": 1 } });
  });

  it("leaves the caller's own object unmutated", () => {
    const source = { keep: { me: 1 } };

    modifyConfig({
      config: { data: source, format: "toml" },
      edits: [{ path: "keep.me", value: 2 }],
    });

    expect(source).toEqual({ keep: { me: 1 } });
  });

  it("reports a text source without a format as an error", () => {
    const { error } = modifyConfig({
      config: { text: "a = 1" } as never,
      edits: [{ path: "a", value: 2 }],
    });

    expect(error).toBeInstanceOf(Error);
  });
});

describe("modifyConfigFile", () => {
  it("writes a toml edit to disk, inferring the format", () => {
    const filepath = fixtureFs.getFilePath("config.fixture.toml");

    const { data, error } = modifyConfigFile(filepath, [
      { path: "mcp_servers.mesh.command", value: "mesh" },
    ]);

    expect(error).toBeUndefined();

    expect(data?.data).toMatchObject({
      mcp_servers: {
        existing: { command: "existing-bin" },
        mesh: { command: "mesh" },
      },
    });

    expect(readFileSync(filepath, "utf-8")).toBe(data?.text);
  });

  it("leaves the file untouched until commit when autoCommit is off", () => {
    const filepath = fixtureFs.getFilePath("workflow.fixture.yaml");

    const before = readFileSync(filepath, "utf-8");

    const { data } = modifyConfigFile(
      filepath,
      [{ path: "name", value: "changed" }],
      { autoCommit: false }
    );

    expect(readFileSync(filepath, "utf-8")).toBe(before);

    data?.commit();

    expect(readFileSync(filepath, "utf-8")).toBe(data?.config.text);
  });

  it("keeps a json file's comments through the surgical editor", () => {
    const filepath = fixtureFs.getFilePath("tsconfig.fixture.json");

    const { data } = modifyConfigFile(filepath, [
      { path: "strict", value: false },
    ]);

    expect(data?.text).toContain("// keep strict on");
  });

  it("reports an unsupported extension as an error rather than throwing", () => {
    const { error } = modifyConfigFile(join(fixturesDir, "notes.txt"), [
      { path: "a", value: 1 },
    ]);

    expect(error).toBeInstanceOf(Error);
  });

  it("reports a missing file as an error rather than throwing", () => {
    const { error } = modifyConfigFile(join(fixturesDir, "absent.toml"), [
      { path: "a", value: 1 },
    ]);

    expect(error).toBeInstanceOf(Error);
  });
});
