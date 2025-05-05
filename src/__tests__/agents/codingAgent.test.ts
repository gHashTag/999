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

  it("should simulate TeamLead -> Coder sequence using mocked network steps", async () => {
    const t = new InngestTestEngine({
      function: runCodingAgent,
    })

    const initialEvent = {
      name: "coding-agent/run",
      data: {
        input: "Implement sum function",
      },
    }

    const mockTeamLeadNetworkResult = {
      state: {
        kv: createMockKvStore({
          status: NetworkStatus.Enum.NEEDS_CODE,
          run_id: "test-run-id-1",
          task: "Implement sum function",
          test_requirements: "* should sum 1 + 1 = 2",
          test_code: "expect(sum(1, 1)).toBe(2);",
          eventId: "test-event-id-1",
          sandboxId: "mock-sandbox-1",
        }),
      },
      output: null,
    }

    const expectedImplementation = "function sum(a, b) { return a + b; }"
    const mockCoderNetworkResult = {
      state: {
        kv: createMockKvStore({
          status: NetworkStatus.Enum.NEEDS_TYPE_CHECK,
          implementation_code: expectedImplementation,
          run_id: "test-run-id-1",
          task: "Implement sum function",
          test_requirements: "* should sum 1 + 1 = 2",
          test_code: "expect(sum(1, 1)).toBe(2);",
          eventId: "test-event-id-1",
          sandboxId: "mock-sandbox-1",
        }),
      },
      output: null,
    }

    const networkStepMock = mock
      .fn()
      .mockResolvedValueOnce(mockTeamLeadNetworkResult)
      .mockResolvedValueOnce(mockCoderNetworkResult)

    const mockSteps = [
      {
        id: "run-agent-network",
        handler: networkStepMock,
      },
    ]

    const { result, state } = await t.execute({
      events: [initialEvent] as any,
      steps: mockSteps,
    })

    expect(result).toBeDefined()
    expect(networkStepMock).toHaveBeenCalledTimes(2)

    const finalNetworkStateResult = await state["run-agent-network"]
    expect(finalNetworkStateResult).toEqual(mockCoderNetworkResult)

    const finalKvStore = finalNetworkStateResult.state.kv
    const finalState = await finalKvStore.get("network_state")
    expect(finalState).toBeDefined()
    expect(finalState?.implementation_code).toBe(expectedImplementation)
    expect(finalState?.status).toBe(NetworkStatus.Enum.NEEDS_TYPE_CHECK)
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
