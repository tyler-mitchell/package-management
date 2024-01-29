import { describe, it, expect } from "vitest";
import { resolvePackageModulePath, isPackageModuleFound } from "@/module";

describe("module", () => {
  it("should successfully resolve a module path", async () => {
    const modulePath = resolvePackageModulePath("vitest");

    expect(modulePath?.length).toBeGreaterThan(1);
  });

  it("should return undefined if the package's module isn't resolved", async () => {
    const modulePath = resolvePackageModulePath("non-existent-package");

    expect(modulePath).toBe(undefined);
  });

  it("should return true if the package's module is found", async () => {
    const isModule = isPackageModuleFound("vitest");

    expect(isModule).toBe(true);
  });

  it("should return false if a package's module is not found", async () => {
    const isModule = isPackageModuleFound("non-existent-package");

    expect(isModule).toBe(false);
  });
});
