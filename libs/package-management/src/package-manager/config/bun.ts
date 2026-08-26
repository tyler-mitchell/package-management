import { definePackageManagerConfig } from "./_define";

export default definePackageManagerConfig({
  id: "bun",
  name: "Bun",
  command: "bun",
  runner: "bunx",
  meta: {
    // Bun wrote a binary lockfile originally and a text one from 1.2 onwards,
    // so a project using either must still be detected.
    lockfile: ["bun.lock", "bun.lockb"],
  },
  args: {
    install: {
      command: "install",
      options: {
        dev: "-D",
        preferOffline: "--prefer-offline",
      },
    },
    uninstall: {
      command: "remove",
    },
  },
  options: {
    version: "--version",
  },
});
