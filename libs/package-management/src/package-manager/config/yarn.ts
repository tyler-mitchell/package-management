import { definePackageManagerConfig } from "./_define";

export default definePackageManagerConfig({
  id: "yarn",
  name: "Yarn",
  command: "yarn",
  runner: "yarn dlx",
  meta: {
    lockfile: "yarn.lock",
    // Berry shares this command and lockfile, so the version decides.
    matchesVersion: (version) => version.startsWith("1."),
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
