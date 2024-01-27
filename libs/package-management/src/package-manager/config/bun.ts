import { definePackageManager } from "../definePackageManager";

export default definePackageManager({
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
        isDevDependency: "-D",
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
