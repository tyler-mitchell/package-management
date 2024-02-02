import { defineEslintConfig } from "@gitdrops/eslint";

const config = await defineEslintConfig({
  files: ["**/*"],
  rules: {
    "ts/ban-types": "off",
    "ts/no-unnecessary-type-constraint": "off",
    "ts/ban-ts-comment": "off",
    "ts/prefer-ts-expect-error": "off",
    "no-template-curly-in-string": "off",
    "no-console": "off",
  },
});

export default config;
