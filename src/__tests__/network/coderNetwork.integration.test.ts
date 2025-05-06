import { describe, it, expect, beforeEach, mock } from "bun:test"
import { InngestTestEngine } from "@inngest/test"
import { runCodingAgent } from "@/inngest/index"
import { setupTestEnvironment } from "../setup/testSetup"
import { NetworkStatus } from "@/types/network"

// Полностью мокируем шаги сети для проверки логики генерации кода локально
describe("Coder Agent Network Integration - Local", () => {
  beforeEach(() => {
    setupTestEnvironment()
  })

  it.skip("should simulate network run for TeamLead -> Coder to generate code locally", async () => {
    const t = new InngestTestEngine({
      function: runCodingAgent,
    })

    // Мокируем создание зависимостей агентов, чтобы избежать вызовов песочницы
    mock.module("@/inngest/logic/dependencyUtils.ts", () => ({
      createAgentDependencies: mock(async (logger, sandboxId) => {
        console.log(
          `[MOCK createAgentDependencies] Called with sandboxId: ${sandboxId}`
        )
        return {
          kv: {
            get: mock(() => undefined),
            set: mock(() => {}),
            getAll: mock(() => ({})),
          },
          log: logger,
          apiKey: "mocked-api-key",
          modelName: "mocked-model",
          systemEvents: [],
          tools: [],
          agents: {
            teamLead: {
              name: "TeamLead Agent",
              run: mock(async () => ({
                status: "NEEDS_CODE",
                test_requirements:
                  "Create a simple Hello World program in JavaScript.",
              })),
            },
            coder: {
              name: "Coder Agent",
              run: mock(async () => ({
                status: "NEEDS_TYPE_CHECK",
                implementation_code: 'console.log("Hello, World!");',
              })),
            },
            critic: {
              name: "Critic Agent",
              run: mock(async () => ({ status: "COMPLETED" })),
            },
            tester: {
              name: "Tester Agent",
              run: mock(async () => ({ status: "NEEDS_TEST_CRITIQUE" })),
            },
            tooling: {
              name: "Tooling Agent",
              run: mock(async () => ({ status: "COMPLETED" })),
            },
          },
        }
      }),
    }))

    // Мокируем network.run для имитации генерации кода
    const networkRunMock = mock().mockImplementation(async task => {
      console.log(`[MOCK network.run] Called with task: ${task}`)
      const taskStr = task.toString()
      if (taskStr.includes("TeamLead")) {
        return {
          state: {
            data: {
              status: "NEEDS_CODE",
              test_requirements:
                "Create a simple Hello World program in JavaScript.",
            },
          },
        }
      } else if (taskStr.includes("Coder")) {
        return {
          state: {
            data: {
              status: "NEEDS_TYPE_CHECK",
              implementation_code: 'console.log("Hello, World!");',
            },
          },
        }
      }
      return {
        state: {
          data: {
            status: "FAILED",
            errors: ["Unknown task"],
          },
        },
      }
    })
    mock.module("@/network/network.ts", () => ({
      createDevOpsNetwork: mock(() => ({
        run: networkRunMock,
      })),
    }))

    // Мокируем только начальное состояние, но не шаги сети
    const getCurrentStateMock = mock().mockImplementation(
      async (_logger, _kvStore, initialTask, eventId) => {
        console.log(
          `[MOCK getCurrentState] Called with eventId: ${eventId}, task: ${initialTask}`
        )
        return {
          run_id: eventId,
          task_description: initialTask,
          status: NetworkStatus.Enum.NEEDS_REQUIREMENTS,
          test_requirements:
            "Create a simple Hello World program in JavaScript.",
        }
      }
    )

    mock.module("@/inngest/logic/stateUtils.ts", () => ({
      getCurrentState: getCurrentStateMock,
      initializeOrRestoreState: mock((..._args: any[]) => {
        console.log("[MOCK initializeOrRestoreState] Called")
        return {
          status: NetworkStatus.Enum.NEEDS_REQUIREMENTS,
          run_id: _args[3],
          task_description: _args[0].input,
        }
      }),
      logFinalResult: mock((..._args: any[]) => {
        console.log("[MOCK logFinalResult] Called")
      }),
    }))

    // Мокируем ensureSandboxId, чтобы избежать любых вызовов песочницы
    mock.module("@/inngest/logic/sandboxUtils.ts", () => ({
      ensureSandboxId: mock(() => Promise.resolve("mocked-sandbox-id")),
      getSandbox: mock(() =>
        Promise.resolve({
          commands: {
            run: async () => ({ stdout: "Mocked command output", stderr: "" }),
            start: async () => ({ success: true }),
            stop: async () => ({ success: true }),
          },
          id: "mocked-sandbox-id",
          setTimeout: () => {},
        })
      ),
    }))

    const result = await t.execute({
      events: [
        {
          name: "coding-agent/run",
          data: {
            input: "Create Hello World program",
            task: "Create Hello World program",
            eventId: "test-event-id-local-network",
          },
        },
      ],
      steps: [], // Не мокируем шаги, позволяя реальной логике выполняться с замоканными данными
    })

    // Проверяем, что результат содержит сгенерированный код
    expect(result.result).toBeDefined()
    // Исправляем проверки, учитывая структуру результата
    expect(result.result.success).toBe(true)
    // Проверяем статус из результата
    expect(result.result.finalStatus).toBe("NEEDS_TYPE_CHECK")
  })
})
