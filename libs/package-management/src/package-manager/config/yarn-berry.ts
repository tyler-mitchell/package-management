import { definePackageManagerConfig } from "./_define";

export default definePackageManagerConfig({
  id: "yarn-berry",
  name: "Yarn Berry",
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
