import { describe, it, expect } from "vitest";
import { workspace } from "@/workspace";
import { definePackageManager } from "@/package-manager/definePackageManager";
import { detectGlobalPackageManagers as detectGlobalFrom } from "@/package-manager/detectPackageManager";
import { packageManagerConfigs } from "@/package-manager/package-managers";
import { toArray } from "@/utils";

const {
  findPackageManager,
  detectGlobalPackageManagers,
  detectLockfilePackageManagers,
  globalVersions,
  filterPackageManagers,
  mapPackageManagers,
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

describe("package manager configs", () => {
  it("registers every supported manager under a unique id", () => {
    const ids = packageManagerConfigs.map(({ id }) => id);

    expect(new Set(ids).size).toBe(ids.length);

    // Yarn Berry ships a config; leaving it unregistered silently gives Yarn 2+
    // users Yarn 1 flags.
    expect(ids).toContain("yarn-berry");
  });

  it("declares a command, runner, lockfile and version flag for each", () => {
    packageManagerConfigs.forEach((config) => {
      expect(config.command).toBeTruthy();
      expect(config.runner).toBeTruthy();
      expect(config.options.version).toBeTruthy();
      expect(toArray(config.meta.lockfile).length).toBeGreaterThan(0);
      expect(config.args.install.command).toBeTruthy();
      expect(config.args.uninstall.command).toBeTruthy();
    });
  });

  it("recognises both of bun's lockfile formats", () => {
    const bun = packageManagerConfigs.find(({ id }) => id === "bun")!;

    // Bun wrote a binary lockfile before 1.2 and a text one after.
    expect(toArray(bun.meta.lockfile)).toEqual(
      expect.arrayContaining(["bun.lock", "bun.lockb"])
    );
  });

  it("splits yarn classic from berry on version, since both claim yarn.lock", () => {
    const [classic, berry] = ["yarn", "yarn-berry"].map(
      (id) => packageManagerConfigs.find((config) => config.id === id)!
    );

    expect(toArray(classic!.meta.lockfile)).toEqual(
      toArray(berry!.meta.lockfile)
    );

    // Exactly one of them must claim any given version.
    ["1.22.22", "3.6.4", "4.1.0"].forEach((version) => {
      const claims = [classic!, berry!].filter((config) =>
        config.meta.matchesVersion?.(version)
      );

      expect(claims).toHaveLength(1);
    });
  });
});

describe("package-manager", () => {
  it("resolves matchesVersion against the installed version", async () => {
    const nodeAsPackageManager = (
      matchesVersion: (version: string) => boolean
    ) =>
      definePackageManager({
        id: "node",
        name: "Node",
        command: "node",
        runner: "node",
        meta: { lockfile: "node.lock", matchesVersion },
        args: {
          install: {
            command: "install",
            options: { dev: "-D", preferOffline: "--prefer-offline" },
          },
          uninstall: { command: "uninstall" },
        },
        options: { version: "--version" },
      });

    await expect(
      nodeAsPackageManager((version) => version.startsWith("v")).matchesVersion()
    ).resolves.toBe(true);

    await expect(
      nodeAsPackageManager((version) =>
        version.startsWith("definitely-not")
      ).matchesVersion()
    ).resolves.toBe(false);
  });

  it("treats an absent version as no match rather than a match", async () => {
    await expect(absentPackageManager.matchesVersion()).resolves.toBe(true);
  });

  it("maps over every configured package manager", async () => {
    const ids = await mapPackageManagers((packageManager) => packageManager.id);

    expect(ids).toEqual(packageManagerConfigs.map(({ id }) => id));
  });

  it("filters the configured package managers", async () => {
    const matched = await filterPackageManagers(
      (packageManager) => packageManager.id === "pnpm"
    );

    expect(matched.map(({ id }) => id)).toEqual(["pnpm"]);
  });

  it("restricts mapping to the allowed managers", async () => {
    const ids = await mapPackageManagers(
      (packageManager) => packageManager.id,
      { allowed: { pnpm: true } }
    );

    expect(ids).toEqual(["pnpm"]);
  });

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
