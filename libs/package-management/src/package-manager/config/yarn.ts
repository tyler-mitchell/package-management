import { definePackageManagerConfig } from "./_define";

export default definePackageManagerConfig({
  id: "yarn",
  name: "Yarn",
  command: "yarn",
  runner: "yarn dlx",
  meta: {
    lockfile: "yarn.lock",
  },
  args: {
    install: {
      command: "add",
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
