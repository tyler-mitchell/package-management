import { globbySync } from "globby";

export const tsconfig = (tsconfigDir: string | undefined) => ({
  get paths() {
    // An unresolved project has no tsconfigs. Passing "" here let globby fall
    // back to the calling process's cwd, so an unresolved project reported
    // whichever tsconfigs happened to sit beside the running process.
    if (!tsconfigDir) return [];

    // Absolute: a bare "tsconfig.json" does not say which project it belongs
    // to, which is the only thing this is asked for.
    return globbySync(["tsconfig.json", "tsconfig.*.json"], {
      cwd: tsconfigDir,
      absolute: true,
    });
  },
});
