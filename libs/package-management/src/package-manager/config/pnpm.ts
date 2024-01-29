import { definePackageManagerConfig } from "./_define";

export default definePackageManagerConfig({
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
