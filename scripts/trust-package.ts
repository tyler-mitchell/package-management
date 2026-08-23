import { execFileSync } from "node:child_process";

execFileSync("npm", ["login"], { stdio: "inherit" });
execFileSync(
  "npm",
  [
    "trust",
    "github",
    "package-management",
    "--file",
    "release.yml",
    "--repository",
    "tyler-mitchell/package-management",
    "--allow-publish",
    "--yes",
  ],
  { stdio: "inherit" },
);
