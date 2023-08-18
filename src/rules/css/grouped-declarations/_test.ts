import path from "path";

import { RuleTester } from "@typescript-eslint/utils/ts-eslint";

import { getCode } from "../../../utils/testing";

import { groupedDeclarationsRule } from "./_rule";

const ruleTester = new RuleTester({
  parser: require("@typescript-eslint/parser"),
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: path.resolve(__dirname, "..", "..", "..", ".."),
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    node: true,
    es2023: true,
    browser: true,
  },
});

const testDir = path.join(__dirname, "tests");

ruleTester.run("css/grouped-properties", groupedDeclarationsRule, {
  valid: [getCode(testDir, "file")],
  invalid: [],
});
