/// <reference types="vitest" />
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true, // Use globals like describe, it, expect without importing
    environment: "node", // Set the test environment to Node.js
    coverage: {
      provider: "v8", // Use v8 for coverage
      reporter: ["text", "json", "html"], // Report formats - already includes html
      include: ["src/**/*.ts"], // Include source files for coverage
      exclude: [
        "src/**/*.test.ts",
        "src/mocks/**/*.ts", // Exclude mocks
        "src/test/**/*.ts", // Exclude test setup
        "src/inngest/types.ts", // Exclude type definitions if they exist
        "node_modules/**",
        "dist/**",
      ],
    },
    // Add setup file if needed later for global mocks or configurations
    setupFiles: ["./src/test/setup.ts"],
    // Add reporters here
    reporters: ["default", "html"], // Add default and html reporters
    outputFile: {
      html: "./html/index.html", // Specify output path for html reporter
    },
  },
})
