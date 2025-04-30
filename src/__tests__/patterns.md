# 🕉️ Паттерны Тестирования Проекта

**Принцип:** Переиспользование проверенных подходов ускоряет разработку и повышает надежность тестов.

Этот документ описывает общие паттерны, используемые при написании тестов в этом проекте. Цель – избежать "изобретения велосипеда" и поддерживать консистентность тестового кода.

## 1. Настройка Окружения и Моки (`setup/testSetupFocused.ts`)

*   **Централизованные Моки:** Все основные моки (логгер, KV, инструменты, базовые зависимости) определены в `src/__tests__/setup/testSetupFocused.ts`.
*   **Автоматический Сброс:** Функция `setupTestEnvironmentFocused` вызывается автоматически перед каждым тестом (`it`) благодаря глобальному хуку `beforeEach`, определенному в том же файле. Она сбрасывает состояние всех моков (`mock.resetAllMocks()`), обеспечивая изоляцию тестов.
*   **Использование:** В `beforeEach` блока вашего `describe` обычно не нужно ничего вызывать для сброса, но можно получить свежие базовые зависимости:
    ```typescript
    import { beforeEach, describe, it, expect } from "bun:test"
    import { createBaseMockDependencies, mockLogger, getMockTools } from "../setup/testSetupFocused"
    import { type AgentDependencies } from "@/types/agents"

    describe("My Feature Tests", () => {
      let baseDeps: ReturnType<typeof createBaseMockDependencies>
      let customDeps: AgentDependencies

      beforeEach(() => {
        // Глобальный хук уже сбросил моки
        baseDeps = createBaseMockDependencies()
        customDeps = {
          ...baseDeps,
          log: mockLogger, // Добавляем логгер, если он нужен
          allTools: getMockTools(["readFile"]), // Добавляем нужные инструменты
        }
      })

      it("should do something", () => {
        // Используем customDeps
        const result = myFunction(customDeps)
        expect(result).toBeDefined()
        expect(mockLogger.info).toHaveBeenCalled()
      })
    })
    ```

## 2. Unit-тестирование Агентов

*   **Цель:** Проверить логику создания агента и базовую функциональность (например, фильтрацию инструментов) в изоляции.
*   **Расположение:** `src/__tests__/agents/`.
*   **Пример (`testerAgent.unit.test.ts`):**
    ```typescript
    import { describe, it, expect } from "bun:test"
    import { createBaseMockDependencies, getMockTools } from "../setup/testSetupFocused"
    import { createTesterAgent } from "@/agents/tester/logic/createTesterAgent"
    import { type AgentDependencies } from "@/types/agents"

    describe("Tester Agent Unit Tests", () => {
      it("should create a Tester agent with default dependencies", () => {
        const baseDeps = createBaseMockDependencies()
        const testerAgent = createTesterAgent(baseDeps, "Instructions")
        expect(testerAgent).toBeDefined()
        expect(testerAgent.name).toBe("Tester")
      })

      it("should filter tools correctly", () => {
        const baseDeps = createBaseMockDependencies()
        const allMockTools = getMockTools([/* ...все инструменты... */])
        const depsWithTools: AgentDependencies = { ...baseDeps, allTools: allMockTools }
        const testerAgent = createTesterAgent(depsWithTools, "Instructions")
        const expectedToolNames = ["readFile", "runTerminalCommand"] // Пример
        expect(testerAgent.tools.size).toBe(expectedToolNames.length)
        expect(Array.from(testerAgent.tools.keys()).sort()).toEqual(expectedToolNames.sort())
      })
    })
    ```

## 3. Unit-тестирование Инструментов

*   **Цель:** Проверить логику работы хендлера (`handler`) инструмента в изоляции.
*   **Расположение:** `src/__tests__/tools/`.
*   **Пример (`updateTaskStateTool.test.ts`):**
    ```typescript
    import { describe, it, expect, beforeEach } from "bun:test"
    import { createBaseMockDependencies, mockLogger, mockKv, findToolMock } from "../setup/testSetupFocused"
    import { createUpdateTaskStateTool } from "@/tools/definitions/updateTaskStateTool"

    describe("Update Task State Tool Unit Tests", () => {
      let deps: ReturnType<typeof createBaseMockDependencies>

      beforeEach(() => {
        deps = createBaseMockDependencies()
      })

      it("should update the status in KV store", async () => {
        const tool = createUpdateTaskStateTool({ ...deps, log: mockLogger, kv: mockKv })
        const params = { updates: { status: "COMPLETED" } }
        const result = await tool.handler(params, {} as any) // Pass mock opts

        expect(result).toEqual({ success: true })
        expect(mockKv.set).toHaveBeenCalledWith("status", "COMPLETED")
        expect(mockLogger.info).toHaveBeenCalled()
      })
    })
    ```

## 4. Интеграционное Тестирование (Общий Подход)

*   **Цель:** Проверить взаимодействие нескольких компонентов.
*   **Расположение:** `src/__tests__/integration/`, `src/__tests__/adapters/`.
*   **Подход:**
    *   Создать необходимые зависимости, включая *реальные* экземпляры тестируемых компонентов (если возможно) и моки для остальных.
    *   Вызвать точку входа взаимодействия (например, `network.run()` или метод адаптера).
    *   Проверить конечное состояние (например, данные в `mockKv`) и/или вызовы моков (например, `mockLogger`, моки инструментов, моки агентов).
*   **Пример:** См. `src/__tests__/adapters/mcpAdapter.integration.test.ts` (текущий разрабатываемый тест).

## 5. Мокирование Вызовов Модели (LLM)

*   При интеграционном тестировании сети или агентов, которые вызывают LLM, необходимо мокировать ответ модели.
*   **Подход:**
    *   Получить доступ к моку адаптера модели (например, `mockDeepseekModelAdapter` из `testSetupFocused.ts`).
    *   В `beforeEach` конкретного теста или `describe` блока переопределить метод `.request` мока, чтобы он возвращал ожидаемый результат для данного теста.
    *   В `afterEach` **обязательно** восстановить исходный метод `.request`, чтобы не повлиять на другие тесты.
    *   **Пример (из `teamLeadWorkflow.test.ts` - закомментирован):**
        ```typescript
        // В beforeEach
        originalModelRequest = (mockDeepseekModelAdapter as any).request
        ;(mockDeepseekModelAdapter as any).request = async () => ({ result: "* Req 1\n* Req 2" })

        // В afterEach
        if (originalModelRequest) {
          ;(mockDeepseekModelAdapter as any).request = originalModelRequest
        }
        ```

*Этот документ будет дополняться по мере появления новых паттернов.* 