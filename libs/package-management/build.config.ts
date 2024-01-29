import { resolve } from "node:path";
import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  clean: true,
  declaration: true,
  failOnWarn: false,
  rollup: {
    inlineDependencies: true,
  },
  alias: {
    "@": resolve(__dirname, "./src"),
  },
});
