// @ts-check

const eslintPluginGroupedCssDeclarations = require("eslint-plugin-grouped-css-declarations");

/**
 * ESLint config.
 * @satisfies {Array<import("eslint").Linter.FlatConfig>}
 */
const eslintConfig = [
  eslintPluginGroupedCssDeclarations.configs["flat/recommended"],
];

module.exports = eslintConfig;
