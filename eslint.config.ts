import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";
import type { Linter } from "eslint";
import globals from "globals";

const config: Linter.Config[] = [
  js.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        project: "./tsconfig.json",
      },
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    plugins: {
      prettier,
    },
    rules: {
      "prettier/prettier": "error",
      "no-unused-vars": "error",
      "no-console": "off",
      "prefer-const": "error",
      "no-var": "error",
    },
  },
  prettierConfig,
  {
    ignores: ["dist/", "node_modules/", "*.js"],
  },
];

export default config;
