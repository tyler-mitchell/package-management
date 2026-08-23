import { definePackageManagerClient } from "package-management";

const packageManager = await definePackageManagerClient({
  cwd: process.cwd(),
}).findPackageManager();

if (packageManager.id !== "npm") {
  throw new Error(`Expected npm from the clean consumer, received ${packageManager.id}.`);
}
