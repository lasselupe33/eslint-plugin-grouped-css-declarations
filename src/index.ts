import { ESLint, Linter, Rule } from "eslint";

import { groupedDeclarationsRule } from "./rules/css/grouped-declarations/_rule";

export const rules = {
  "css/grouped-declarations": groupedDeclarationsRule,
} as unknown as Record<string, Rule.RuleModule>;

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
} satisfies Record<
  string,
  | ESLint.ConfigData<Linter.RulesRecord>
  | Linter.FlatConfig
  | Linter.FlatConfig[]
>;

export default {
  rules,
  configs,
};
