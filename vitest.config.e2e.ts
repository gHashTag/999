/// <reference types="vitest" />
import { defineConfig } from "vitest/config"
import path from "path" // Import path module

// Конфигурация ТОЛЬКО для E2E тестов
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    // ВАЖНО: setupFiles (с MSW) здесь НЕ указываем
    // setupFiles: ["./src/test/setup.ts"],
    include: ["__tests__/e2e/**/*.test.ts"], // Указываем, что этот конфиг только для E2E
    // Настройки reporters и outputFile можно оставить или убрать для E2E, если не нужны
    reporters: ["default"], // Оставим только default для E2E
    // outputFile: {
    //   html: "./html-e2e/index.html", // Можно сделать отдельный отчет для E2E
    // },
    // Уменьшим таймауты для E2E
    testTimeout: 90000, // 1.5 минуты на тест
    hookTimeout: 60000, // 1 минута на хуки (beforeAll/afterAll)
  },
})
