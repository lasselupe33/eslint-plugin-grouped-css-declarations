import { ESLint, Linter, Rule } from "eslint";

import { groupedDeclarationsRule } from "./rules/css/grouped-declarations/_rule";

export const rules = {
  "css/grouped-declarations": groupedDeclarationsRule,
} as unknown as Record<string, Rule.RuleModule>;

const plugin = {
  meta: {
    name: "eslint-plugin-grouped-css-declarations",
    version: "1.0.0",
  },
  rules,
};

export const configs = {
  recommended: {
    extends: ["plugin:grouped-css-declarations/css"],
    plugins: ["grouped-css-declarations"],
  },

  css: {
    plugins: ["grouped-css-declarations"],
    rules: {
      "grouped-css-declarations/css/grouped-declarations": ["error"],
    },
  },

  "flat/recommended": {
    files: [
      "**/*.js",
      "**/*.mjs",
      "**/*.jsx",
      "**/*.ts",
      "**/*.mts",
      "**/*.tsx",
    ],
    plugins: {
      "grouped-css-declarations": plugin,
    },
    rules: {
      "grouped-css-declarations/css/grouped-declarations": ["error"],
    },
  } satisfies Linter.FlatConfig,
} satisfies Record<
  string,
  | ESLint.ConfigData<Linter.RulesRecord>
  | Linter.FlatConfig
  | Linter.FlatConfig[]
>;

export default {
  meta: plugin.meta,
  rules,
  configs,
};
