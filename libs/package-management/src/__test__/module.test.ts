import { describe, it, expect } from "vitest";
import {
  resolvePackageModulePath,
  isPackageModuleFound,
  resolveModule,
} from "@/module";

describe("resolveModule", () => {
  it("unwraps a default export", async () => {
    await expect(resolveModule({ default: "value" })).resolves.toBe("value");
  });

  it("unwraps a falsy default rather than the namespace around it", async () => {
    // `default || namespace` handed back the whole namespace whenever the
    // default export was 0, "" or false.
    await expect(resolveModule({ default: 0 })).resolves.toBe(0);
    await expect(resolveModule({ default: "" })).resolves.toBe("");
    await expect(resolveModule({ default: false })).resolves.toBe(false);
  });

  it("returns a module with no default unchanged", async () => {
    await expect(resolveModule({ named: 1 })).resolves.toEqual({ named: 1 });
  });

  it("passes a null module through instead of throwing", async () => {
    await expect(resolveModule(null)).resolves.toBeNull();
  });
});

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
