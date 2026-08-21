import { describe, it, expect } from "vitest";
import { workspace } from "@/workspace";
import { definePackageManager } from "@/package-manager/definePackageManager";
import { detectGlobalPackageManagers as detectGlobalFrom } from "@/package-manager/detectPackageManager";

const {
  findPackageManager,
  detectGlobalPackageManagers,
  detectLockfilePackageManagers,
  globalVersions,
} = workspace.getProject("<package_folder>");

/**
 * A package manager whose command cannot exist, so that global detection can be
 * tested against a definite absence. Asserting over the real managers cannot do
 * this: on a machine where all of them are installed, "report the installed
 * ones" and "report everything" produce identical results.
 */
const absentPackageManager = definePackageManager({
  id: "absent",
  name: "Absent",
  command: "package-manager-that-cannot-be-installed",
  runner: "package-manager-that-cannot-be-installed",
  meta: { lockfile: "absent.lock" },
  args: {
    install: {
      command: "add",
      options: { dev: "-D", preferOffline: "--prefer-offline" },
    },
    uninstall: { command: "remove" },
  },
  options: { version: "--version" },
});

describe("package-manager", () => {
  it("detects global package managers", async () => {
    const packageManagers = await detectGlobalPackageManagers();

    expect(packageManagers.length).greaterThanOrEqual(1);
  });

  it("reports the global version of each installed package manager", async () => {
    const versions = await globalVersions();

    const installed = Object.values(versions).filter(
      (version): version is string => version !== undefined
    );

    expect(installed.length).toBeGreaterThanOrEqual(1);

    // A discarded stdout yields the string "undefined" for managers that are
    // in fact installed, which this catches.
    installed.forEach((version) => {
      expect(version).toMatch(/^\d+\.\d+\.\d+/);
    });
  });

  it("excludes a package manager whose command is not installed", async () => {
    const detected = await detectGlobalFrom([absentPackageManager]);

    expect(detected).toHaveLength(0);
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
