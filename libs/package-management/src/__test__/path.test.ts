import { describe, expect, it } from "vitest";
import { getPath } from "../path/getPath";
import { basename, join, relative } from "pathe";
import os from "node:os";
import process from "node:process";

const CURRENT_FILE_PATH = __filename;

const CURRENT_DIR_PATH = __dirname;

describe("alias resolution — tuple form", () => {
  it("resolves <current_file>", () => {
    expect(getPath({ to: ["<current_file>"] })).toBe(CURRENT_FILE_PATH);
  });

  it("resolves <current_folder>", () => {
    expect(getPath({ to: ["<current_folder>"] })).toBe(CURRENT_DIR_PATH);
  });

  it("resolves <cwd>", () => {
    expect(getPath({ to: ["<cwd>"] })).toBe(process.cwd());
  });

  it("joins a subpath onto the resolved alias", () => {
    expect(
      getPath({ to: ["<current_folder>", basename(CURRENT_FILE_PATH)] })
    ).toBe(CURRENT_FILE_PATH);
  });

  it("resolves a subpath alias registered on the alias map", () => {
    expect(getPath({ to: ["<package_folder>/node_modules"] })).toBe(
      join(getPath({ to: ["<package_folder>"] }), "node_modules")
    );
  });

  it("resolves a path relative to another alias", () => {
    expect(
      getPath({ to: ["<user_tmpdir>"], startingFrom: ["<current_file>"] })
    ).toBe(relative(CURRENT_FILE_PATH, os.tmpdir()));
  });
});

describe("alias resolution — string form", () => {
  it("resolves a bare alias token", () => {
    expect(getPath("<cwd>")).toBe(process.cwd());
  });

  it("resolves an alias token carrying a subpath", () => {
    expect(getPath("<cwd>/src")).toBe(join(process.cwd(), "src"));
  });

  it("prefers the longest matching alias so subpath aliases win", () => {
    expect(getPath("<package_folder>/node_modules")).toBe(
      join(getPath("<package_folder>"), "node_modules")
    );
  });

  it("passes a literal path through untouched", () => {
    expect(getPath("/tmp/literal/path.ts")).toBe("/tmp/literal/path.ts");
  });

  it("agrees with the tuple form for the same location", () => {
    expect(getPath("<user_home>")).toBe(getPath({ to: ["<user_home>"] }));
  });
});

describe("alias resolution — repository locations", () => {
  it("resolves <gitroot_folder> to a real directory", () => {
    expect(getPath({ to: ["<gitroot_folder>"] })).toBe(
      getPath({ to: ["<workspace_folder>"] })
    );
  });

  it("gives <workspace_folder?> no git-root fallback, unlike <workspace_folder>", () => {
    const outsideAnyWorkspace = os.tmpdir();

    // With the fallback, resolution continues past the missing workspace and
    // fails looking for a git root.
    expect(() =>
      getPath({ to: ["<workspace_folder>"], cwd: outsideAnyWorkspace })
    ).toThrow(/not in a git repository/);

    // Without it, resolution stops at the missing workspace — which is the
    // whole point of the `?` variant.
    expect(() =>
      getPath({ to: ["<workspace_folder?>"], cwd: outsideAnyWorkspace })
    ).toThrow(/Could not find workspace folder/);
  });

  it("honours an explicit cwd", () => {
    expect(getPath({ to: ["<package_folder>"], cwd: CURRENT_DIR_PATH })).toBe(
      getPath({ to: ["<package_folder>"] })
    );
  });
});

describe("alias resolution — failure reporting", () => {
  it("throws rather than returning a malformed path for an unknown alias", () => {
    // @ts-expect-error — exercising the runtime guard behind the alias union.
    expect(() => getPath({ to: ["<not_an_alias>"] })).toThrow(
      /Path alias resolved to no location/
    );
  });

  it("reports a missing path as undefined only when asked to validate", () => {
    expect(
      getPath({
        to: ["<current_folder>", "definitely-not-here.ts"],
        checkExistence: true,
      })
    ).toBeUndefined();
  });
});
