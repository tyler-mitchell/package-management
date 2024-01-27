import { definePackageManager } from "../definePackageManager";

export default definePackageManager({
  id: "pnpm",
  name: "PNPM",
  command: "pnpm",
  runner: "pnpx",
  meta: {
    lockfile: "pnpm-lock.yaml",
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
