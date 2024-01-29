import { globbySync } from "globby";

export const tsconfig = (tsconfigDir: string) => ({
  get paths() {
    return (
      globbySync(["tsconfig.json", "tsconfig.*.json"], {
        cwd: tsconfigDir,
      }) ?? []
    );
  },
});
