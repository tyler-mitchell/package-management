import { findPackageManager } from "@/package-manager/detectPackageManager";
import { describe, it, expect } from "vitest";
import { isPackageDependency } from "..";
import { mockPackages } from "./mock-utils";

const packageManager = await findPackageManager();

const { getPackageName, getPackageNames } = mockPackages;

describe("install and uninstall packages", () => {
  it(
    "pnpm - should install and uninstall package",
    async () => {
      const packageName = getPackageName("lodash-es");

      expect(isPackageDependency(packageName)).toBe(false);

      await packageManager.installPackage(packageName);

      expect(isPackageDependency(packageName)).toBe(true);

      await packageManager.uninstallPackage(packageName);

      expect(isPackageDependency(packageName)).toBe(false);
    },
    {
      timeout: 20000,
    }
  );
  it(
    "pnpm - should install and uninstalll multiple packages",
    async () => {
      const packageNames = getPackageNames(["lodash-es", "is-odd"]);

      expect(isPackageDependency(packageNames)).toBe(false);

      await packageManager.installPackage(packageNames);

      expect(isPackageDependency(packageNames)).toBe(true);

      await packageManager.uninstallPackage(packageNames);

      expect(isPackageDependency(packageNames)).toBe(false);
    },
    {
      timeout: 20000,
    }
  );
});
