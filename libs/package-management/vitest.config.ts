import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Replaces the `vite-tsconfig-paths` plugin, which Vite now supersedes with
    // native resolution of the `@/*` entries in tsconfig.json.
    tsconfigPaths: true,
  },
  test: {
    // The install/uninstall tests rewrite package.json, and package.json is a
    // force-rerun trigger by default — which would restart the suite endlessly
    // in watch mode. Narrowing the triggers to config files stops that.
    forceRerunTriggers: ["**/vitest.config.*/**", "**/vite.config.*/**"],
  },
});
