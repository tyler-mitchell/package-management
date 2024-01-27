import { definePackageManager } from "../definePackageManager";

export default definePackageManager({
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
        isDevDependency: "-D",
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
