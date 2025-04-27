// @ts-check

import eslint from "@eslint/js"
import tseslint from "typescript-eslint"
// No need for eslint-config-prettier if not using eslint-plugin-prettier
import globals from "globals" // Ensure globals is imported
// import path from 'path'; // Import path if needed for tsconfigRootDir

/**
 * @type {import('typescript-eslint').Config}
 */
export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node, // Add Node.js globals
        ...globals.browser, // Add Browser globals
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-debugger": "warn",
      "no-console": [
        "warn",
        { allow: ["warn", "error", "info", "debug", "table"] },
      ],
      "prefer-const": "warn",
      "no-useless-escape": "off",
      "no-prototype-builtins": "warn",
      "no-undef": "off",
      indent: "off",
      "@typescript-eslint/indent": "off",
    },
  },
  {
    ignores: [
      "dist/",
      "*.config.js",
      "*.config.ts",
      "**/node_modules/**",
      ".wrangler/",
      "html/", // Ensure coverage report dir is ignored
      ".husky/",
      ".cursor/",
      "artifacts/",
      "*.mjs", // Ignore MJS files globally for now, handle separately if needed
      "open-codex/", // Игнорируем пакет open-codex
    ],
  }
)
