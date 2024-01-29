import { describe, expect, it } from "vitest";
import { workspace } from "../workspace";

const ROOT_PACKAGE_NAME = "monorepo";

const CURRENT_PACKAGE_NAME = "package-management";

describe("workspace-tools", () => {
  it("get root project", () => {
    const project = workspace.getProject("@root");

    expect(project.packageName).toBe(ROOT_PACKAGE_NAME);
  });

  it("get this project", () => {
    const project = workspace.getProject("@package");

    expect(project.packageName).toBe(CURRENT_PACKAGE_NAME);
  });

  it("get a project by its package.json#name", () => {
    const project = workspace.getProject(CURRENT_PACKAGE_NAME);

    expect(project.packageName).toBe(CURRENT_PACKAGE_NAME);
  });

  it("get the list of packages that are apart of the workspace", () => {
    const withRoot = workspace.packageList({ includeRoot: true });

    expect(withRoot.some((e) => e.name === CURRENT_PACKAGE_NAME));

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

  it("get the tsconfig paths for this project", () => {
    const project = workspace.getProject("@package");

    const tsconfigPaths = project.tsconfig.paths;

    expect(tsconfigPaths.includes("tsconfig.json")).toBe(true);
  });

  it("get the list of gitignore patterns from the workspace root", () => {
    const project = workspace.getProject("@root");

    const { gitignore } = project;

    expect(gitignore.patterns).toContain("node_modules");
  });

  it("find a dependency from this project's package.json", () => {
    const project = workspace.getProject("@package");

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
