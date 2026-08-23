import { existsSync, readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync("libs/package-management/package.json", "utf8")) as {
  name?: string;
  repository?: string | { url?: string };
  scripts?: { prepack?: string };
};
const repository =
  typeof manifest.repository === "string" ? manifest.repository : manifest.repository?.url;

if (manifest.name !== "package-management") throw new Error("Package name does not match setup.");
if (!repository?.includes("tyler-mitchell/package-management")) {
  throw new Error("repository.url does not match setup.");
}
if (!manifest.scripts?.prepack) throw new Error("scripts.prepack is required.");
if (!existsSync("scripts/verify-published.mjs")) {
  throw new Error("A concrete published-package probe is required.");
}
