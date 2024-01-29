import { describe, it, expect } from "vitest";
import { workspace } from "@/workspace";

const {
  findPackageManager,
  detectGlobalPackageManagers,
  detectLockfilePackageManagers,
} = workspace.getProject("@package");

describe("package-manager", () => {
  it("detects global package managers", async () => {
    const packageManagers = await detectGlobalPackageManagers();

    expect(packageManagers.length).greaterThanOrEqual(1);
  });

  it("detects lockfile package managers", async () => {
    const packageManagers = await detectLockfilePackageManagers();

    expect(packageManagers.length).greaterThanOrEqual(1);
  });

  it("detects only the allowed package managers", async () => {
    const allowedPackageManagers = {
      global: await detectGlobalPackageManagers({
        allowed: {},
      }),
      local: await detectGlobalPackageManagers({
        allowed: {},
      }),
    };

    expect(allowedPackageManagers.global).toHaveLength(0);

    expect(allowedPackageManagers.local).toHaveLength(0);
  });

  it("find a package manager", async () => {
    const packageManager = (await findPackageManager())!;

    expect(packageManager.id).toBe("pnpm");
  });

  it("throws an error when no package manager is found", async () => {
    expect(
      findPackageManager({
        allowed: {},
      })
    ).rejects.toThrowError();
  });
});
