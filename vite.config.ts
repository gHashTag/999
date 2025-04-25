/// <reference types="vitest" />
import { defineConfig } from "vite"
import { VitePluginNode } from "vite-plugin-node"
import path from "path" // Import path module
import checker from "vite-plugin-checker"

export default defineConfig(({ command }) => ({
  // Shared settings for both serve and build
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // Use absolute path resolution for '@' alias
    },
  },

  // Server specific settings (for 'vite' or 'pnpm run dev')
  server: {
    // Configure server for vite-plugin-node
    // The port needs to match the one Inngest expects (APP_PORT or 8484)
    port: parseInt(process.env.APP_PORT || "8484", 10),
  },

  // Build specific settings (for 'vite build' or 'pnpm run build')
  build: {
    // Tell Vite that we are building for SSR (Node.js)
    ssr: true,
    // Ensure Rollup generates ESM output
    rollupOptions: {
      output: {
        format: "esm",
      },
    },
    // Optional: Set output directory if different from default 'dist'
    // outDir: 'dist',
  },

  // Test specific settings (from original vitest.config.ts)
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "__tests__/**/*.test.ts",
        "src/mocks/**/*.ts",
        "src/test/**/*.ts",
        "src/inngest/types.ts",
        "node_modules/**",
        "dist/**",
      ],
    },
    setupFiles: ["./src/test/setup.ts"],
    reporters: ["default", "html"],
    outputFile: {
      html: "./html/index.html",
    },
  },

  // Plugins
  plugins: [
    ...VitePluginNode({
      // Specify the adapter to use (express for our case)
      // The path should point to the file where the Express app is created and listened on
      adapter: "fastify",
      appPath: "./src/server/index.ts",

      // Optional: Define the export name of the Express app instance
      exportName: "app",

      // Enable TypeScript integration (using swc for speed)
      tsCompiler: "swc", // or 'esbuild'

      // Optional: Change options for SWC compiler
      // swcOptions: {},

      // Optional: Change options for esbuild compiler
      // esbuildOptions: {},
    }),
    checker({ typescript: true }),
  ],

  // Optimize dependencies for SSR build if needed
  // optimizeDeps: {
  //   // It might be necessary to disable optimizing deps for SSR builds
  //   // or specifically include/exclude certain dependencies
  //   disabled: false,
  // },

  // Define build target for Node.js compatibility if needed
  // ssr: {
  //   // Specify Node.js version target if necessary
  //   // target: 'node18',
  //   // Ensure external dependencies are handled correctly
  //   // noExternal: ['@inngest/agent-kit', 'inngest', '@e2b/code-interpreter', /* other deps */ ],
  //   // external: [],
  // },
}))
