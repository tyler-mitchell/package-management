import { describe, it, expect } from "vitest";
import { mockPackages } from "./mock-utils";
import { workspace } from "@/workspace";

const { getPackageName } = mockPackages;

const project = workspace.getProject("<package_folder>");

const packageManager = await project.findPackageManager();

describe("install and uninstall packages", { timeout: 20000 }, () => {
  it("should install and uninstall package", async () => {
    const packageName = getPackageName("lodash-es");

    await packageManager.uninstallPackage(packageName);

    expect(project.isDependencyInPackageJson(packageName)).toBe(false);

    await packageManager.installPackage(packageName);

    expect(project.isDependencyInPackageJson(packageName)).toBe(true);

    await packageManager.uninstallPackage(packageName);

    expect(project.isDependencyInPackageJson(packageName)).toBe(false);
  });

  it("should install and uninstall multiple packages", async () => {
    const packageNames = ["lodash-es", "is-odd"];

    await packageManager.uninstallPackage(packageNames);

    packageNames.forEach((name) => {
      const exists = project.isDependencyInPackageJson(name);
      expect(exists).toBe(false);
    });

    await packageManager.installPackage(packageNames);

    packageNames.forEach((name) => {
      const exists = project.isDependencyInPackageJson(name);

      expect(exists).toBe(true);
    });

    await packageManager.uninstallPackage(packageNames);
  });

  it("should be able to install and import modules using an import map", async () => {
    const { definePackage: $, defineImportMap } = packageManager;
    await packageManager.uninstallPackage("lodash-es");

    const { lodash } = await defineImportMap({
      lodash: $<{ get: (v: object, key: string) => any }>({
        name: "lodash-es",
      }),
    });

    const user = {
      name: "john",
    };

    const username = lodash.get(user, "name");

    expect(username).toBe("john");

    await packageManager.uninstallPackage("lodash-es");
  });
});
