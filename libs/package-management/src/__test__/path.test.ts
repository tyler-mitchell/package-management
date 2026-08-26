import { describe, expect, it } from "vitest";
import { getPath } from "../path/getPath";
import { getGitRootFolder } from "@/path/getGitRootFolder";
import { createFile } from "@/fs/createFile";
import { execaSync } from "execa";
import { rmSync } from "node:fs";
import { basename, dirname, join, relative } from "pathe";
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
    // The two variants only differ inside a git repository that is not a
    // workspace: anywhere else they either both resolve or both fail.
    const repo = join(os.tmpdir(), `package-management-repo-${process.pid}`);

    createFile(join(repo, "package.json"), `{"name":"standalone"}`);

    execaSync("git", ["init", "--quiet"], { cwd: repo });

    try {
      // With the fallback, resolution continues past the missing workspace and
      // settles on the git root.
      expect(getPath({ to: ["<workspace_folder>"], cwd: repo })).toContain(
        "package-management-repo-"
      );

      // Without it, resolution stops at the missing workspace — which is the
      // whole point of the `?` variant.
      expect(() =>
        getPath({ to: ["<workspace_folder?>"], cwd: repo })
      ).toThrow(/Could not find workspace folder/);
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  it("reports a missing git root without throwing when asked not to", () => {
    expect(
      getGitRootFolder({ cwd: os.tmpdir(), throwIfNotFound: false })
    ).toBeUndefined();
  });

  it("throws for a missing git root by default", () => {
    expect(() => getGitRootFolder({ cwd: os.tmpdir() })).toThrow(
      /not in a git repository/
    );
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

  it("keeps the alias when a later segment walks upward", () => {
    // Joining before substituting let `..` cancel the token itself, which then
    // matched no alias and produced a plausible relative path instead.
    expect(getPath({ to: ["<cwd>", ".."] })).toBe(dirname(process.cwd()));

    expect(getPath({ to: ["<cwd>", "../sibling"] })).toBe(
      join(dirname(process.cwd()), "sibling")
    );
  });

  it("refuses a subpath of an alias that resolves nowhere", () => {
    // The bare alias was guarded but its subpaths were not, so an unresolvable
    // parent yielded a path rooted at `/`.
    expect(() =>
      getPath({ to: ["<package_folder>/node_modules"], cwd: os.tmpdir() })
    ).toThrow(/resolved to no location/);
  });

  it("loads the predefined aliases without a circular import", async () => {
    // Importing these through the barrel is a cycle back into `getPath`, which
    // builds its map from this module at evaluation time.
    await expect(
      import("@/path/predefinedPathAliases")
    ).resolves.toHaveProperty("predefinedPathAliases");
  });

  it("resolves a glob to a matching path", () => {
    expect(
      getPath({ to: ["<package_folder>", "package.json"], glob: true })
    ).toBe(getPath({ to: ["<package_folder>", "package.json"] }));
  });

  it("reports an unmatched glob as undefined", () => {
    expect(
      getPath({ to: ["<package_folder>", "*.definitely-not-here"], glob: true })
    ).toBeUndefined();
  });

  it("resolves an existing path when asked to validate", () => {
    expect(
      getPath({ to: ["<package_folder>", "package.json"], checkExistence: true })
    ).toContain("package.json");
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
