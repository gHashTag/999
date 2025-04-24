// @ts-check

import eslint from "@eslint/js"
import tseslint from "typescript-eslint"
import prettierConfig from "eslint-config-prettier" // Use eslint-config-prettier
import globals from "globals" // Added import

/**
 * @type {import('typescript-eslint').Config}
 */
export default tseslint.config(
  {
    // Global ignores
    ignores: [
      "dist/",
      "node_modules/",
      "html/",
      ".husky/",
      ".cursor/",
      "*.cjs",
      "artifacts/",
      "db.js",
    ],
  },
  // Base ESLint recommended rules
  eslint.configs.recommended,
  // TypeScript recommended rules
  ...tseslint.configs.recommended,
  {
    // Specific config for Node.js script (.mjs)
    files: ["scripts/send-test-event.mjs"],
    languageOptions: {
      globals: {
        ...globals.node, // Add Node.js globals
      },
    },
    rules: {
      // Add specific rules for this file if needed
      "@typescript-eslint/no-require-imports": "off", // Allow require if needed (though it's .mjs)
    },
  },
  {
    // Default rules for the rest of the project
    // Apply Prettier config (must be last to override other formatting rules)
    ...prettierConfig, // Moved prettier config application here to ensure it applies to TS files too
    rules: {
      // Prettier warnings (use as warning, not error)
      // We rely on the prettier hook/formatter primarily
      "prettier/prettier": "off", // Disable eslint-plugin-prettier rule, rely on eslint-config-prettier

      // Allow unused vars prefixed with _
      "no-unused-vars": "off", // Disable base rule, use TS version
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Allow explicit any, but warn
      "@typescript-eslint/no-explicit-any": "warn",
    },
  }
)
