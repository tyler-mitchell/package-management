import { describe, expect, it } from "vitest";
import { workspace } from "../workspace";
import { isPackageDependency } from "@/isPackageDependency";
import { isPackageNameInWorkspace } from "@/workspace/isPackageNameInWorkspace";
import { getFolderByPackageName } from "@/path/getFolderByPackageName";

const ROOT_PACKAGE_NAME = "@package-management/monorepo";

const CURRENT_PACKAGE_NAME = "package-management";

describe("workspace-tools", () => {
  it("get workspace package name", () => {
    const project = workspace.getProject("<workspace_folder>");

    expect(project.packageName).toBe(ROOT_PACKAGE_NAME);
  });

  it("get this project", () => {
    const project = workspace.getProject("<package_folder>");

    expect(project.packageName).toBe(CURRENT_PACKAGE_NAME);
  });

  it("get a project by its package.json#name", () => {
    const project = workspace.getProject({ packageName: CURRENT_PACKAGE_NAME });

    expect(project.packageName).toBe(CURRENT_PACKAGE_NAME);
  });

  it("get the list of packages that are apart of the workspace", () => {
    const withRoot = workspace.packageList({ includeRoot: true });

    expect(withRoot.some((e) => e.name === CURRENT_PACKAGE_NAME)).toBe(true);

    expect(withRoot[0]?.name).toBe(ROOT_PACKAGE_NAME);

    const withoutRoot = workspace.packageList({ includeRoot: false });

    expect(withRoot.length > withoutRoot.length).toBe(true);

    expect(withoutRoot[0]?.name).not.toBe(ROOT_PACKAGE_NAME);
  });

  it("get the record of packages that are apart of the workspace", () => {
    const withRoot = workspace.packageGraph({ includeRoot: true });

    expect(CURRENT_PACKAGE_NAME in withRoot).toBe(true);

    expect(ROOT_PACKAGE_NAME in withRoot).toBe(true);

    const withoutRoot = workspace.packageGraph({ includeRoot: false });

    expect(CURRENT_PACKAGE_NAME in withoutRoot).toBe(true);

    expect(ROOT_PACKAGE_NAME in withoutRoot).toBe(false);
  });

  it("finds the workspace root package by name", () => {
    // The root is a package too, so name-based lookup has to reach it.
    const project = workspace.getProject({ packageName: ROOT_PACKAGE_NAME });

    expect(project.packageName).toBe(ROOT_PACKAGE_NAME);
  });

  it("lists the workspace package names", () => {
    const withRoot = workspace.packageNames({ includeRoot: true });

    expect(withRoot).toContain(CURRENT_PACKAGE_NAME);
    expect(withRoot).toContain(ROOT_PACKAGE_NAME);

    expect(workspace.packageNames({ includeRoot: false })).not.toContain(
      ROOT_PACKAGE_NAME
    );
  });

  it("reports whether a name belongs to the workspace", () => {
    expect(isPackageNameInWorkspace(CURRENT_PACKAGE_NAME)).toBe(true);

    expect(isPackageNameInWorkspace(ROOT_PACKAGE_NAME)).toBe(true);

    expect(isPackageNameInWorkspace("not-in-this-workspace")).toBe(false);

    expect(isPackageNameInWorkspace(undefined)).toBe(false);
  });

  it("resolves a package folder from its name", () => {
    const folder = getFolderByPackageName(CURRENT_PACKAGE_NAME);

    expect(folder).toBe(workspace.getProject("<package_folder>").projectDir);

    expect(getFolderByPackageName("not-in-this-workspace")).toBeUndefined();
  });

  it("reports whether packages are declared in the nearest package.json", () => {
    expect(isPackageDependency("vitest")).toBe(true);

    expect(isPackageDependency(["vitest", "execa"])).toBe(true);

    expect(isPackageDependency("!does-not-exist")).toBe(false);

    // Every name must match, so one absent package fails the set.
    expect(isPackageDependency(["vitest", "!does-not-exist"])).toBe(false);
  });

  it("get the tsconfig paths for this project", () => {
    const project = workspace.getProject("<package_folder>");

    const tsconfigPaths = project.tsconfig.paths;

    expect(tsconfigPaths.includes("tsconfig.json")).toBe(true);
  });

  it("get the list of gitignore patterns from the workspace workspace folder", () => {
    const project = workspace.getProject("<workspace_folder>");

    const { gitignore } = project;

    expect(gitignore.patterns).toContain("node_modules");
  });

  it("find a dependency from this project's package.json", () => {
    const project = workspace.getProject("<package_folder>");

    const { firstMatch: foundPackage } =
      project.findDependencyInPackageJson({
        name: "vitest",
        type: "devDependency",
      }) ?? {};

    // const exists = nodeModuleExists("node");

    // expect(exists).toBeTypeOf("object");

    expect(
      project.isDependencyInPackageJson({
        name: "vitest",
        type: "devDependency",
      })
    ).toBe(true);

    expect(
      project.findDependencyInPackageJson({
        name: "!does-not-exist",
        type: "devDependency",
      })
    ).toBe(undefined);

    expect(
      project.isDependencyInPackageJson({
        name: "!does-not-exist",
        type: "devDependency",
      })
    ).toBe(false);
  });
});
