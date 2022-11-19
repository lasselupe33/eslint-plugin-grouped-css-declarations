import { groupedPropertiesRule } from "./rules/css/grouped-properties/_rule";

export const rules = {
  "css/grouped-properties": groupedPropertiesRule,
};

export const configs = {
  recommended: {
    extends: ["plugin:starter/css"],
    plugins: ["starter"],
  },

  css: {
    plugins: ["starter"],
    rules: {
      "starter/css/grouped-properties": ["error"],
    },
  },
};
