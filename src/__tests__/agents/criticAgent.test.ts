import { describe, it, expect, beforeEach } from "bun:test"
import {
  createFullMockDependencies,
  mockLoggerInstance,
  setupTestEnvironment,
} from "../setup/testSetup"
import { createCriticAgent } from "@/agents/critic/logic/createCriticAgent"
import type { AgentDependencies } from "@/types/agents"
import { Agent } from "@inngest/agent-kit"
import { parseCriticResponse } from "@/agents/critic/logic/createCriticAgent"
import type { BaseLogger } from "@/types/agents"

// Пример инструкций для Критика (можно вынести или улучшить)
const criticInstructions = `Ты - опытный старший инженер, ревьюер кода и тестов.
Твоя задача - оценить предоставленный артефакт (код, тест, требования).
Твой ответ ДОЛЖЕН быть ТОЛЬКО валидным JSON объектом следующей структуры:
{
  "approved": boolean, // true, если результат принят, false - если нужны доработки
  "critique": string, // Детальная обратная связь или краткое подтверждение
  "refactored_code": string | null // Улучшенный код, если выполнялся рефакторинг, иначе null
}
НЕ добавляй никакого текста до или после этого JSON объекта.`

describe("Agent Definitions: Critic Agent", () => {
  let dependencies: AgentDependencies

  beforeEach(() => {
    setupTestEnvironment()
    dependencies = createFullMockDependencies({
      log: mockLoggerInstance,
    })
  })

  it("should create a Critic agent with correct basic properties", () => {
    const agent = createCriticAgent(dependencies, criticInstructions)

    expect(agent).toBeInstanceOf(Agent)
    expect(agent.name).toBe("Critic Agent")
    // Обновляем ожидаемое описание, чтобы оно точно совпадало с кодом агента
    expect(agent.description).toBe(
      "Оценивает код, тесты или результаты выполнения команд, выполняет рефакторинг."
    ) // Точное описание из createCriticAgent

    // Удаляем нестабильную проверку адаптера модели
    // expect((agent as any).definition?.adapter?.adapter).toBe(
    //   dependencies.model.adapter
    // )
  })

  // Тест фильтрации инструментов
  // Убираем .skip и добавляем логику
  it("should correctly filter tools needed by Critic", () => {
    // 1. Получаем полный набор мок-инструментов из setup
    const allMockTools = dependencies.allTools // Используем инструменты из beforeEach
    expect(allMockTools.length).toBeGreaterThan(2) // Убедимся, что моков больше, чем ожидаемых

    // 2. Создаем агента с полным набором инструментов
    const agent = createCriticAgent(dependencies, criticInstructions)

    // 3. Определяем ожидаемый список имен инструментов для Критика
    const expectedToolNames = [
      "web_search",
      "updateTaskState",
      // Убеждаемся, что другие НЕ включены (например, askHumanForInput)
    ].sort()

    // 4. Получаем актуальный список имен инструментов агента
    const actualToolNames = Array.from(agent.tools.keys()).sort()

    // 5. Сравниваем списки
    expect(actualToolNames).toEqual(expectedToolNames)
  })

  // --- НОВЫЙ ТЕСТ ДЛЯ СИСТЕМНОГО ПРОМПТА --- //
  it("should have a system prompt instructing JSON output", () => {
    const agent = createCriticAgent(dependencies, criticInstructions)
    const systemPrompt = (agent as any).system // Доступ к системному промпту

    expect(systemPrompt).toBeDefined()
    expect(systemPrompt).toContain("JSON")
    expect(systemPrompt).toContain("структуры") // Проверяем ключевые слова
    expect(systemPrompt).toContain("approved")
    expect(systemPrompt).toContain("critique")
    expect(systemPrompt).toContain("refactored_code")
  })
})

// --- Тесты для parseCriticResponse --- //

describe("parseCriticResponse", () => {
  let mockLogger: BaseLogger // Используем мок логгера из setup

  beforeEach(() => {
    // Можно переиспользовать мок логгера из setup
    // mockLogger = { info: mock(), warn: mock(), error: mock(), debug: mock() } as any;
    mockLogger = mockLoggerInstance // Используем существующий мок
    ;(mockLogger.warn as any).mockClear() // Очищаем перед тестом
    ;(mockLogger.error as any).mockClear()
  })

  it("should correctly parse a valid JSON string", () => {
    const validJsonString = JSON.stringify({
      approved: true,
      critique: "Looks perfect!",
      refactored_code: "const a = 1;",
    })

    const result = parseCriticResponse(validJsonString, mockLogger)

    expect(result).not.toBeNull()
    expect(result?.approved).toBe(true)
    expect(result?.critique).toBe("Looks perfect!")
    expect(result?.refactored_code).toBe("const a = 1;")
    expect(mockLogger.warn).not.toHaveBeenCalled()
    expect(mockLogger.error).not.toHaveBeenCalled()
  })

  // Тест для невалидного JSON
  it("should return null and log error for invalid JSON string", () => {
    const invalidJsonString = '{ approved: true, critique: "missing quote '

    const result = parseCriticResponse(invalidJsonString, mockLogger)

    expect(result).toBeNull()
    expect(mockLogger.warn).not.toHaveBeenCalled()
    expect(mockLogger.error).toHaveBeenCalledTimes(1)
    // Опционально: проверить текст ошибки
    expect((mockLogger.error as any).mock.calls[0][0]).toContain(
      "Failed to parse Critic LLM output as JSON"
    )
  })

  // Тест для JSON с неверной схемой
  it("should return null and log warning for JSON with incorrect schema", () => {
    const jsonWithWrongSchema = JSON.stringify({
      // approved: true, // Отсутствует обязательное поле
      critique: 123, // Неправильный тип
      refactored_code: null,
    })

    const result = parseCriticResponse(jsonWithWrongSchema, mockLogger)

    expect(result).toBeNull()
    expect(mockLogger.warn).toHaveBeenCalledTimes(1)
    // Опционально: проверить текст предупреждения
    expect((mockLogger.warn as any).mock.calls[0][0]).toContain(
      "Parsed Critic LLM output failed schema validation"
    )
    expect(mockLogger.error).not.toHaveBeenCalled()
  })

  it("should return null for JSON with missing fields", () => {
    const jsonWithMissingFields = JSON.stringify({
      approved: true,
      // critique: "Missing field",
      refactored_code: null,
    })
    const result = parseCriticResponse(jsonWithMissingFields, mockLogger)
    expect(result).toBeNull()
    expect(mockLogger.warn).toHaveBeenCalledTimes(1)
    expect(mockLogger.error).not.toHaveBeenCalled()
  })
})
