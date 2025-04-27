/// <reference types="vitest" />
import { defineConfig, loadEnv } from "vite"
import { VitePluginNode } from "vite-plugin-node"
import path from "path" // Import path module
import checker from "vite-plugin-checker"
// Temporarily comment out markdown plugin import and usage
// import { markdown as mdPlugin, Mode } from "vite-plugin-markdown";
import tsconfigPaths from "vite-tsconfig-paths" // Add this import

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
    globalSetup: "./src/__tests__/globalSetup.ts",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/__tests__/**/*.test.ts",
        "src/mocks/**/*.ts",
        "src/test/**/*.ts",
        "src/inngest/types.ts",
        "node_modules/**",
        "dist/**",
      ],
    },
    setupFiles: ["./src/__tests__/setup.ts"],
    reporters: ["default", "html"],
    outputFile: {
      html: "./html/index.html",
    },
  },

  // Plugins
  plugins: [
    tsconfigPaths(), // Add this line
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
    // Temporarily comment out markdown plugin usage
    // mdPlugin({
    //   mode: [Mode.MARKDOWN],
    // }),
  ],

  // Optimize dependencies for SSR build if needed
  // Убираем optimizeDeps
  // optimizeDeps: {
  //   include: ["zod"],
  // },

  // Define build target for Node.js compatibility if needed
  // Убираем ssr
  // ssr: {
  //   noExternal: ["zod"],
  // },
}))
