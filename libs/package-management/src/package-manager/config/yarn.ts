import { definePackageManager } from "../definePackageManager";

export default definePackageManager({
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
        isDevDependency: "-D",
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
