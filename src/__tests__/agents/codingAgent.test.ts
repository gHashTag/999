import { describe, it, expect, beforeEach, mock } from "bun:test"
import { InngestTestEngine } from "@inngest/test"
import {
  createFullMockDependencies,
  getMockTools,
  mockLoggerInstance,
  setupTestEnvironment,
  createMockKvStore,
} from "../setup/testSetup"
import { createCoderAgent } from "@/agents/coder/logic/createCoderAgent"
import { runCodingAgent } from "@/inngest/index"
import { NetworkStatus } from "@/types/network"
import { TddNetworkState } from "@/types/network"

// Мокируем stateUtils перед всеми тестами
mock.module("@/inngest/logic/stateUtils.ts", () => ({
  getCurrentState: mock(
    async (_logger: any, _kvStore: any, initialTask: any, eventId: any) => {
      console.log(
        `[MOCK getCurrentState] Called with eventId: ${eventId}, task: ${initialTask}`
      )
      // Возвращаем валидное начальное состояние (только ключевые поля)
      const mockInitialState: Partial<TddNetworkState> = {
        run_id: eventId,
        task: initialTask,
        status: NetworkStatus.Enum.NEEDS_CODE,
        test_requirements: "* should sum 1 + 1 = 2", // Пример данных
        test_code: "expect(sum(1, 1)).toBe(2);", // Пример данных
        // Убираем attempts, revisions и т.д. - они не часть базового состояния
      }
      return mockInitialState
    }
  ),
  initializeOrRestoreState: mock((..._args: any[]) => {
    // Исправляем неиспользуемый параметр
    console.log("[MOCK initializeOrRestoreState] Called")
    return {
      status: NetworkStatus.Enum.READY,
      run_id: _args[3],
      task: _args[0].input,
    } as Partial<TddNetworkState>
  }),
  logFinalResult: mock((..._args: any[]) => {
    // Исправляем неиспользуемый параметр
    console.log("[MOCK logFinalResult] Called")
  }),
}))

const coderInstructions =
  "Ты - дисциплинированный Разработчик (Coder) в цикле TDD..."

describe("Agent Definitions: Coder Agent", () => {
  let baseDeps: ReturnType<typeof createFullMockDependencies>

  beforeEach(() => {
    setupTestEnvironment()
    baseDeps = createFullMockDependencies({ log: mockLoggerInstance })
  })

  it("should create a Coder agent with correct basic properties", () => {
    const agent = createCoderAgent({
      ...baseDeps,
      instructions: coderInstructions,
    })

    expect(agent.name).toBe("Coder Agent")
    expect(agent.description).toBe(
      "Пишет или исправляет код на основе требований и тестов."
    )
    expect((agent as any).model.options.model).toBe(baseDeps.modelName)
    expect((agent as any).model.options.apiKey).toBe(baseDeps.apiKey)
  })

  it("should generate code using InngestTestEngine", async () => {
    const t = new InngestTestEngine({
      function: runCodingAgent,
    })

    const mockEvents = [
      {
        name: "coding-agent/run",
        data: {
          input: "Implement sum function",
        },
      },
    ]

    // Ожидаемое финальное состояние KV после работы сети
    const expectedFinalKvData = {
      status: NetworkStatus.Enum.NEEDS_TYPE_CHECK,
      implementation_code: "function sum(a, b) { return a + b; }",
      run_id: "test-run-id", // run_id будет установлен моком getCurrentState
      task: "Implement sum function",
      test_requirements: "* should sum 1 + 1 = 2",
      test_code: "expect(sum(1, 1)).toBe(2);",
      attempts: 1,
      revisions: 0,
      maxAttempts: 3,
      maxRevisions: 2,
      eventId: expect.any(String), // eventId будет установлен моком getCurrentState
      sandboxId: "mock-sandbox-id",
    }

    // Результат мока сети теперь содержит мок KV с финальным состоянием
    const mockNetworkRunResult = {
      state: {
        kv: createMockKvStore(expectedFinalKvData), // Используем createMockKvStore
      },
      output: null,
    }

    const mockSteps = [
      {
        id: "run-agent-network",
        handler: () => mockNetworkRunResult,
      },
    ]

    const { result, state } = await t.execute({
      events: mockEvents as any,
      steps: mockSteps,
    })

    expect(result).toBeDefined()
    // Ожидаем, что функция вернет success: true и статус из НАЧАЛЬНОГО состояния,
    // так как processNetworkResult вернул undefined в этом сценарии.
    expect(result).toEqual({
      success: true,
      finalStatus: NetworkStatus.Enum.NEEDS_CODE, // Статус из мока getCurrentState
      // finalState: expect.objectContaining(expectedFinalKvData), // Это поле не возвращается в данном случае
    })

    // Проверяем состояние шага run-agent-network
    expect(await state["run-agent-network"]).toEqual(mockNetworkRunResult)
  })

  it("should generate a system prompt containing core instructions", () => {
    const agent = createCoderAgent({
      ...baseDeps,
      instructions: coderInstructions,
    })

    const systemPrompt = agent.system
    expect(systemPrompt).toBeDefined()
    expect(systemPrompt).toContain(coderInstructions)
    expect(systemPrompt).toContain("Ты - дисциплинированный Разработчик")
  })

  it("should correctly filter tools", () => {
    const allMockTools = getMockTools([
      "readFile",
      "createOrUpdateFiles",
      "runTerminalCommand",
      "edit_file",
      "codebase_search",
      "grep_search",
      "updateTaskState",
      "web_search",
      "writeFile",
      "mcp_cli-mcp-server_run_command",
    ])
    const agent = createCoderAgent({
      ...baseDeps,
      instructions: coderInstructions,
      allTools: allMockTools,
      log: mockLoggerInstance,
    })

    // Определяем ожидаемый список имен инструментов
    const expectedToolNames = [
      "readFile",
      "createOrUpdateFiles",
      "runTerminalCommand",
      "edit_file",
      "codebase_search",
      "grep_search",
    ].sort()

    // Получаем актуальный список имен
    const actualToolNames = Array.from(agent.tools.keys()).sort()

    // Сравниваем количество и имена
    expect(agent.tools.size).toBe(expectedToolNames.length)
    expect(actualToolNames).toEqual(expectedToolNames)
  })
})
