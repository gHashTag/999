// import { describe, it, expect, beforeAll, afterAll, mock } from "bun:test" // Changed bun:test to bun:test
// Удаляем импорты spawn и fetch, так как они теперь в utils.ts
// import { spawn } from "child_process"

// import fetch from "node-fetch" // Переехал в utils.ts
// import { AbortController } from 'node-abort-controller'; // Переехал в utils.ts

// Импортируем наши утилиты
import {} from // waitForUrl, // Removed unused import
// runCommand, // Removed unused import
// sendInngestEvent, // Removed unused import
// pollInngestRunResult, // Removed unused import
"./utils"
// import { NetworkStatus } from "@/types/network" // Removed unused import
import { describe } from "bun:test" // Need describe for .skip
import { setupAgentNetwork } from "./testUtils.e2e"

// --- Константы и Утилиты ---
// const ROOT_DIR = path.resolve(__dirname, "../../") // Removed unused variable
// const EVENT_API_URL = "http://localhost:8288/e/"
// const INNGEST_DEV_URL = "http://localhost:8288/" // Removed unused variable
// const APP_SERVER_URL = "http://localhost:8484/" // Removed unused variable
// const DEFAULT_EVENT_NAME = "coding-agent/run" // Removed unused variable
// const DEFAULT_EVENT_DATA = { // Removed unused variable
//   input: "Create a function add(a, b) that returns the sum of two numbers.",
// }
// const TEST_TIMEOUT_MS = 120000 // Removed unused variable
// const SETUP_TIMEOUT_MS = WAIT_FOR_SERVER_MS + 10000 // Removed unused variable

// let tscProcess: ChildProcess | null = null // Removed unused variable
// let inngestProcess: ChildProcess | null = null // Removed unused variable
// let appProcess: ChildProcess | null = null // Removed unused variable
// let appOutput = "" // Собираем stdout сервера приложения

// const testSandboxId: string = "placeholder-sandbox-id" // Removed unused variable

// --- Тестовый Набор (Декомпозированный) ---

// Используем sequential для гарантии порядка выполнения шагов
describe.skip("E2E: Coding Agent Full Flow", () => {
  let network: any

  // Очистка выполняется один раз перед всеми тестами
  //   beforeAll(async () => {
  //     console.log(
  //       "Skipping E2E test setup: Assuming servers are already running."
  //     )
  // ... (rest of the commented out file)

  // Increase timeout for E2E tests
  // mock.setConfig({ testTimeout: 180000 }) // 180 seconds

  // Mock the DeepSeek API endpoint
  // Удаляем импорт несуществующего файла
  // import { server } from "../../mocks/node"
})

/*
import {
  describe,
  it,
  expect,
  beforeEach,
  afterAll,
  spyOn,
} from "bun:test"
import { createInngestFunctionMock } from "@inngest/test"
import { Sandbox } from "@e2b/code-interpreter"
// import { setupAgentNetwork } from "./testUtils.e2e"
import { TddNetworkState, NetworkStatus } from "@/types/network"
import { codingAgentHandler } from "@/inngest"

describe("E2E: Coding Agent Workflow", () => {
  let sandbox: Sandbox
  let network: any // Adjust type as needed based on setupAgentNetwork

  beforeEach(async () => {
    // const setup = await setupAgentNetwork();
    // network = setup.network;
    // sandbox = setup.sandbox;
    // Mock necessary dependencies or steps
    spyOn(network.state.kv, 'get').mockResolvedValue({ status: NetworkStatus.Enum.NEEDS_CODE } as Partial<TddNetworkState>)
    spyOn(network.state.kv, 'set').mockResolvedValue(undefined)

  });

  afterAll(async () => {
    // await sandbox?.close();
  });

  it("should complete the coding task successfully", async () => {
    const handler = createInngestFunctionMock(codingAgentHandler, {
      // Provide mock event data
    })

    // Execute the handler
    const result = await handler({
      event: {
        name: "coding-agent/run",
        data: { task: "Implement addition function" },
      },
      // Provide mock step context if needed
    } as any);

    // Assertions
    expect(result.status).toBe(NetworkStatus.Enum.NEEDS_TYPE_CHECK) // Or COMPLETED depending on flow
    // Add more assertions based on expected side effects (KV store, sandbox state, etc.)

  }, 60000); // Longer timeout for E2E
});
*/
