import { resolve } from "node:path";
import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  rollup: {
    inlineDependencies: true,
  },
  clean: true,
  declaration: true,
  alias: {
    "@": resolve(__dirname, "./src"),
  },
  failOnWarn: false,
});
