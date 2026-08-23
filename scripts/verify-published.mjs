import { findPackageManager, packageManagerConfigs } from "package-management";

const packageManager = await findPackageManager(packageManagerConfigs, {
  cwd: process.cwd(),
});

if (packageManager.id !== "npm") {
  throw new Error(`Expected npm from the clean consumer, received ${packageManager.id}.`);
}
