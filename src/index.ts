import { groupedPropertiesRule } from "./rules/css/grouped-properties/_rule";

export const rules = {
  "css/grouped-properties": groupedPropertiesRule,
};

export const configs = {
  recommended: {
    extends: ["plugin:css-linaria/css"],
    plugins: ["css-linaria"],
  },

  css: {
    plugins: ["css-linaria"],
    rules: {
      "css-linaria/css/grouped-properties": ["error"],
    },
  },
};
