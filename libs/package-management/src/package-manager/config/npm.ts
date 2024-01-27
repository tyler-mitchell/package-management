import { definePackageManager } from "../definePackageManager";

export default definePackageManager({
  id: "npm",
  name: "NPM",
  command: "npm",
  runner: "npx",
  meta: {
    lockfile: ["package-lock.json", "npm-shrinkwrap.json"],
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
