import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    // Remove package.json from watch inorder to prevent tests from running
    // infinitely in watch-mode after they modify the package.json
    watchExclude: ["**/package.json/**"],
    forceRerunTriggers: ["**/vitest.config.*/**", "**/vite.config.*/**"],
  },
});
