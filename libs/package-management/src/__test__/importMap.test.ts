import { describe, it, expect, afterAll } from "vitest";
import { importMap } from "@/module";
import {
  definePackageNames,
  mockPackages,
} from "@/__test__/mock-utils/mock-utils";
import { definePackage } from "../module/importer";

describe.skip(
  "test",
  () => {
    it("successfully imports a package", async () => {
      const { package1 } = await importMap({
        package1: () => import("@antfu/install-pkg"),
      });

      expect(package1).toHaveProperty("installPackage");
    });

    it("successfully installs and imports a package", async () => {
      type LodashMapFn = <TList extends any[], TResult>(
        arr: TList,
        transformer: (v: TList[number]) => TResult
      ) => TResult[];

      interface LodashEsModule {
        map: LodashMapFn;
      }

      const { package1 } = await importMap({
        package1: definePackage<LodashEsModule>("lodash-es"),
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
