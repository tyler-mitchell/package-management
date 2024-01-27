import { fromEntries } from "@/utils";
import bun from "./config/bun";
import npm from "./config/npm";
import pnpm from "./config/pnpm";
import yarn from "./config/yarn";
// import yarnBerry from "./config/yarn-berry";

export type PackageManagerId = keyof typeof packageManagers;

export const packageManagers = fromEntries(
  [pnpm, yarn, bun, npm].map((e) => [e.id, e] as const)
);
