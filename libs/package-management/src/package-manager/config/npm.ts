import { definePackageManagerConfig } from "./_define";

export default definePackageManagerConfig({
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
