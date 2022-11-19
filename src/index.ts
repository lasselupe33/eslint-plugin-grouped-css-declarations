import { groupedDeclarationsRule } from "./rules/css/grouped-declarations/_rule";

export const rules = {
  "css/grouped-declarations": groupedDeclarationsRule,
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
};
