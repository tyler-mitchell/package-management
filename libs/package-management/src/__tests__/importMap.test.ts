import { describe, it, expect, afterAll } from "vitest";
import { importMap } from "../importMap";
import {
  definePackageNames,
  mockPackages,
} from "@/__tests__/mock-utils/mock-utils";

definePackageNames;

describe(
  "test",
  () => {
    it("successfully imports a package", async () => {
      const { package1 } = await importMap({
        package1: () => import("@antfu/install-pkg"),
      });

      expect(package1).toHaveProperty("installPackage");
    });

    it.only("successfully installs and imports a package", async () => {
      const { package1 } = await importMap({
        package1: {
          name: "lodash-es",
          import: () =>
            // @ts-ignore
            import("lodash-es") as Promise<{
              map: <TList extends any[], TResult>(
                a: TList,
                b: (v: TList[number]) => TResult
              ) => TResult[];
            }>,
        },
      });

      const result = package1.map([1, 2, 3], (n) => n * 2);

      expect(result).toEqual([2, 4, 6]);

      await mockPackages.uninstall("lodash-es");
    });
  },
  {
    timeout: 10000,
  }
);

// function getPackageManagerVersion(packageManager: string) {
//   execa()
// }
