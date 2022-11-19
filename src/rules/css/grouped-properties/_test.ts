import path from "path";

import { ESLintUtils } from "@typescript-eslint/utils";

import { getCode } from "../../../utils/testing";

import { groupedPropertiesRule, MessageIds } from "./_rule";

const ruleTester = new ESLintUtils.RuleTester({
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: path.resolve(__dirname, "..", "..", "..", ".."),
    ecmaFeatures: {
      jsx: true,
    },
  },
});

const testDir = path.join(__dirname, "tests");

ruleTester.run("css/grouped-properties", groupedPropertiesRule, {
  valid: [getCode(testDir, "file")],
  invalid: [],
});
