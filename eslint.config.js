import { defineEslintConfig } from "@gitdrops/eslint";

const config = await defineEslintConfig({
  files: ["**/*"],
  rules: {
    "ts/ban-types": "off",
    "ts/no-unnecessary-type-constraint": "off",
  },
});

export default config;
