/// <reference types="vitest" />
import { defineConfig } from "vitest/config"
import path from "path" // Import path module

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // Use absolute path resolution
    },
  },
  test: {
    globals: true, // Use globals like describe, it, expect without importing
    environment: "node", // Set the test environment to Node.js
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8", // Use v8 for coverage
      reporter: ["text", "json", "html"], // Report formats - already includes html
      include: ["src/**/*.ts"], // Include source files for coverage
      exclude: [
        "src/**/*.test.ts", // Keep excluding specific test files in src if any
        "__tests__/e2e/**/*.test.ts",
        "src/mocks/**/*.ts", // Exclude mocks
        "src/test/**/*.ts", // Exclude test setup
        "src/inngest/types.ts", // Exclude type definitions if they exist
        "node_modules/**",
        "dist/**",
      ],
    },
    reporters: ["default", "html"], // Add default and html reporters
    outputFile: {
      html: "./html/index.html", // Specify output path for html reporter
    },
  },
})
