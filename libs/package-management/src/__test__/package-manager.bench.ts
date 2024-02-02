/* eslint-disable test/consistent-test-it */
import type { BenchFunction } from "vitest";
import { describe, bench } from "vitest";
import { workspace } from "@/workspace";
import { execa } from "execa";

const project = workspace.getProject("<package_folder>");

const packageManager = await project.findPackageManager();

const common = { iterations: 1 };

function benchmark(
  name: `${"install" | "uninstall"}${string}`,
  fn: BenchFunction
) {
  const { installPackage, uninstallPackage } = packageManager;
  const isInstallBench = name.startsWith("install");

  const hooks = {
    setup: isInstallBench ? uninstallPackage : installPackage,
  };

  bench(name, fn, {
    iterations: 1,
    warmupIterations: 0,

    setup: async () => {
      await hooks.setup("lodash-es");
    },
  });
}

describe("package manager benchmarks", () => {
  benchmark("install package via package manager", async () => {
    await packageManager.installPackage("lodash-es", { preferOffline: true });
  });

  benchmark("install package via shell directly", async () => {
    await execa("pnpm", ["install", "lodash-es", "--prefer-offline"]);
  });

  // benchmark(
  //   "uninstall package via packager manager",
  //   async () => packageManager.uninstallPackage("lodash-es")
  //   // {
  //   //   setup: async () => {
  //   //     await packageManager.installPackage("lodash-es");
  //   //   },
  //   //   iterations: 1,
  //   // }
  // );
});
