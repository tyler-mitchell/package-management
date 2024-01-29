import { definePackageManagerConfig } from "./_define";

export default definePackageManagerConfig({
  id: "bun",
  name: "Bun",
  command: "bun",
  runner: "bunx",
  meta: {
    lockfile: "bun.lockb",
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
      command: "uninstall",
    },
  },
  options: {
    version: "--version",
  },
});
