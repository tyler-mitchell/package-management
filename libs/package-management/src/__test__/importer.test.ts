import { describe, it, expect } from "vitest";
import { importer, importMap, definePackage } from "@/module";

describe("importer", () => {
  it("imports from a callback returning a module", async () => {
    const [installPkg] = await importer([() => import("@antfu/install-pkg")]);

    expect(installPkg).toHaveProperty("installPackage");
  });

  it("imports from a promise given directly", async () => {
    const [resolved] = await importer([Promise.resolve({ value: 1 })]);

    expect(resolved).toEqual({ value: 1 });
  });

  it("unwraps a default export", async () => {
    const [resolved] = await importer([
      Promise.resolve({ default: { value: 2 } }),
    ]);

    expect(resolved).toEqual({ value: 2 });
  });

  it("keeps the order of the imports it was given", async () => {
    const resolved = await importer([
      Promise.resolve({ default: "first" }),
      Promise.resolve({ default: "second" }),
    ]);

    expect(resolved).toEqual(["first", "second"]);
  });

  it("does not install a package that is already a dependency", async () => {
    // `vitest` is declared here, so no installer should ever be reached.
    const installed: string[] = [];

    const [resolved] = await importer(
      [definePackage<{ default: unknown }>("vitest")],
      {
        installer: async (name) => {
          installed.push(...[name].flat());
        },
      }
    );

    expect(installed).toEqual([]);
    expect(resolved).toBeDefined();
  });
});

describe("importMap", () => {
  it("resolves a record of imports under the same keys", async () => {
    const { first, second } = await importMap({
      first: Promise.resolve({ default: "one" }),
      second: Promise.resolve({ default: "two" }),
    });

    expect({ first, second }).toEqual({ first: "one", second: "two" });
  });
});
