import { definePackageManagerConfig } from "./_define";

export default definePackageManagerConfig({
  id: "yarn-berry",
  name: "Yarn Berry",
  command: "yarn",
  runner: "yarn dlx",
  meta: {
    lockfile: "yarn.lock",
    // Classic shares this command and lockfile; everything past 1.x is Berry.
    matchesVersion: (version) => !version.startsWith("1."),
  },
  args: {
    install: {
      command: "add",
      options: {
        dev: "-D",
        preferOffline: "--cached",
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
