/* eslint-disable no-console */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest"
// Удаляем импорты spawn и fetch, так как они теперь в utils.ts
// import { spawn } from "child_process"

// import fetch from "node-fetch" // Переехал в utils.ts
// import { AbortController } from 'node-abort-controller'; // Переехал в utils.ts

// Импортируем наши утилиты
import {
  // waitForUrl, // Removed unused import
  // runCommand, // Removed unused import
  sendInngestEvent,
  pollInngestRunResult,
} from "./utils"
import { NetworkStatus } from "@/types/network"

// --- Константы и Утилиты ---
// const ROOT_DIR = path.resolve(__dirname, "../../") // Removed unused variable
// const EVENT_API_URL = "http://localhost:8288/e/"
// const INNGEST_DEV_URL = "http://localhost:8288/" // Removed unused variable
// const APP_SERVER_URL = "http://localhost:8484/" // Removed unused variable
const DEFAULT_EVENT_NAME = "coding-agent/run"
const DEFAULT_EVENT_DATA = {
  input: "Create a function add(a, b) that returns the sum of two numbers.",
}
const TEST_TIMEOUT_MS = 120000 // 2 минуты на выполнение шага обработки события
// const SETUP_TIMEOUT_MS = WAIT_FOR_SERVER_MS + 10000 // Removed unused variable

// let tscProcess: ChildProcess | null = null // Removed unused variable
// let inngestProcess: ChildProcess | null = null // Removed unused variable
// let appProcess: ChildProcess | null = null // Removed unused variable
// let appOutput = "" // Собираем stdout сервера приложения

let testSandboxId: string = "placeholder-sandbox-id"
/* // Removed unused function
const pollForRunState = async (
  predicate: (run: any) => boolean
): Promise<any> => {
  console.warn(
    "WARN: pollForRunState is a placeholder! Using predicate: ",
    predicate.toString()
  )
  // Placeholder implementation: return a mock state after a delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  return {
    status: "COMPLETED", // Mock status
    output: {
      status: NetworkStatus.Enum.NEEDS_TEST, // Default mock state
      task: "Write a function that adds two numbers.",
    },
  }
}
*/
// --- Тестовый Набор (Декомпозированный) ---

// Используем sequential для гарантии порядка выполнения шагов
describe.sequential("E2E: Coding Agent Full Flow", () => {
  let eventIdForCompletedTest: string | undefined
  let eventIdForCritiqueTest: string | undefined

  // Очистка выполняется один раз перед всеми тестами
  beforeAll(async () => {
    console.log(
      "Skipping E2E test setup: Assuming servers are already running."
    )
    // Clear the specific test log file
    // clearTestLogFile()
    // // START: Remove server management from test
    // console.log("Starting E2E test setup: Killing existing processes...")
    // const killProc = runCommand(
    //   "exec",
    //   ["bash", "scripts/kill-ports.sh"],
    //   ROOT_DIR
    // )
    // await new Promise((resolve, reject) => {
    //   killProc.on("close", code => {
    //     console.log(`kill-ports.sh finished with code ${code}.`)
    //     resolve(code)
    //   })
    //   killProc.on("error", reject)
    // })
    // await new Promise(resolve => setTimeout(resolve, 200))
    //
    // console.log("Forcefully killing any process on port 8484...")
    // const forceKillProc = runCommand(
    //   "exec",
    //   ["bash", "-c", "lsof -ti :8484 | xargs kill -9 || true"],
    //   ROOT_DIR
    // )
    // await new Promise((resolve, reject) => {
    //   forceKillProc.on("close", code => {
    //     console.log(`Force kill on 8484 finished with code ${code}.`)
    //     resolve(code)
    //   })
    //   forceKillProc.on("error", reject)
    // })
    // await new Promise(resolve => setTimeout(resolve, 200))
    // console.log("Port cleanup finished.")
    //
    // console.log("Building project...")
    // const buildProc = runCommand("run", ["build"], ROOT_DIR)
    // await new Promise((resolve, reject) => {
    //   buildProc.on("close", code => {
    //     if (code === 0) {
    //       console.log("Project built successfully.")
    //       resolve(code)
    //     } else {
    //       reject(new Error(`Build failed with code ${code}`))
    //     }
    //   })
    //   buildProc.on("error", reject)
    // })
    //
    // console.log("Starting Inngest Dev Server...")
    // inngestProcess = runCommand("run", ["dev:serve"], ROOT_DIR)
    // const inngestReady = await waitForUrl(INNGEST_DEV_URL, WAIT_FOR_SERVER_MS)
    // if (!inngestReady) {
    //   throw new Error(`Inngest Dev Server (${INNGEST_DEV_URL}) failed to start`)
    // }
    // console.log("Inngest Dev Server started.")
    //
    // console.log("Starting App Server via nodemon (dev:start)...")
    // appProcess = runCommand("run", ["dev:start"], ROOT_DIR)
    // appOutput = "" // Reset output
    // if (appProcess?.stdout) {
    //   ;(appProcess.stdout as NodeJS.ReadableStream).on("data", data => {
    //     appOutput += data.toString()
    //   })
    // }
    // if (appProcess?.stderr) {
    //   ;(appProcess.stderr as NodeJS.ReadableStream).on("data", data => {
    //     appOutput += data.toString()
    //   })
    // }
    //
    // const appReady = await waitForUrl(APP_SERVER_URL, WAIT_FOR_SERVER_MS)
    // if (!appReady) {
    //   console.error("App server output during startup:", appOutput) // Log output on failure
    //   throw new Error(`App Server (${APP_SERVER_URL}) failed to start`)
    // }
    // console.log("App Server started.")
    // // END: Remove server management from test

    // We still need to collect app output for log checking
    // This assumes the app is already running (launched by the user)
    // How to capture output from an externally launched process? This is tricky.
    // For now, we'll clear the placeholder `appOutput`
    // appOutput = ""
    console.log("Cleared appOutput buffer.")

    testSandboxId = `e2b-sandbox-${Date.now()}`
    console.log(`Using placeholder Sandbox ID: ${testSandboxId}`)
  }, 10000) // Reduced timeout as we are not starting servers

  // Очистка после всех тестов
  afterAll(() => {
    console.log(
      "Skipping E2E test cleanup: Assuming servers are managed externally."
    )
    // // START: Remove server cleanup
    // console.log("Cleaning up E2E test resources...")
    // const killGracefully = (process: ChildProcess | null, name: string) => {
    //   if (process && !process.killed) {
    //     console.log(`Attempting to kill ${name} gracefully (SIGINT/SIGTERM)...`)
    //     process.kill("SIGTERM") // Сначала SIGTERM
    //     setTimeout(() => {
    //       if (!process.killed) {
    //         console.warn(`${name} did not exit, sending SIGKILL...`)
    //         process.kill("SIGKILL") // Крайняя мера
    //       }
    //     }, 5000) // Ждем 5 секунд перед SIGKILL
    //   }
    // }
    // killGracefully(inngestProcess, "inngest dev:serve")
    // killGracefully(appProcess, "nodemon app (dev:start)") // Убиваем nodemon
    // console.log("Cleanup commands issued.")
    // return new Promise(resolve => setTimeout(resolve, 7000)) // Увеличиваем паузу на очистку
    // // END: Remove server cleanup
  }, 5000) // Reduced timeout

  // Шаг 1: Отправка тестового события
  it(`should send ${DEFAULT_EVENT_NAME} event successfully`, async () => {
    console.log(`Sending ${DEFAULT_EVENT_NAME} event...`)
    const eventResponse = await sendInngestEvent(
      DEFAULT_EVENT_NAME,
      DEFAULT_EVENT_DATA
    )
    expect(eventResponse.status).toBe(200)
    // DEBUG: Log the actual response body
    console.log("Response body for COMPLETED check:", eventResponse.body)
    // Capture eventId for later use
    try {
      const body = JSON.parse(eventResponse.body)
      eventIdForCompletedTest = body?.ids?.[0] // Store for the COMPLETED test
      console.log(
        `[TEST] Event ID for COMPLETED check: ${eventIdForCompletedTest}`
      )
    } catch (e) {
      console.error(
        "Failed to parse event response body for completed test:",
        e
      )
    }
    expect(eventIdForCompletedTest).toBeDefined()
    // No need for extra sleep here
  }, 15000)

  // --- Re-enable and update skipped tests ---
  it(
    "should eventually run to COMPLETED status", // Renamed for clarity
    async () => {
      expect(eventIdForCompletedTest).toBeDefined() // Ensure we have the eventId

      const result = await pollInngestRunResult(
        eventIdForCompletedTest!,
        TEST_TIMEOUT_MS - 5000
      )

      expect(result).toBeDefined()
      expect(result).not.toBeNull()
      expect(result.error).toBeNull()

      const finalState = result.finalState
      expect(finalState).toBeDefined()
      expect(finalState.status).toBe(NetworkStatus.Enum.COMPLETED) // Check for COMPLETED

      console.log("Agent network completed successfully with status COMPLETED.")
    },
    TEST_TIMEOUT_MS
  )

  it(
    "should handle initial task and transition to NEEDS_REQUIREMENTS_CRITIQUE", // Renamed for clarity
    async () => {
      console.log("--- Test: Initial Task -> NEEDS_REQUIREMENTS_CRITIQUE ---")
      const eventResponse = await sendInngestEvent(
        DEFAULT_EVENT_NAME,
        DEFAULT_EVENT_DATA
      )
      expect(eventResponse.status).toBe(200)

      // DEBUG: Log the actual response body
      console.log("Response body for CRITIQUE check:", eventResponse.body)

      // Capture eventId for this specific test
      try {
        const body = JSON.parse(eventResponse.body)
        eventIdForCritiqueTest = body?.ids?.[0]
        console.log(
          `[TEST] Event ID for CRITIQUE check: ${eventIdForCritiqueTest}`
        )
      } catch (e) {
        console.error(
          "Failed to parse event response body for critique test:",
          e
        )
      }
      expect(eventIdForCritiqueTest).toBeDefined()

      // Poll for the result of this specific event
      const result = await pollInngestRunResult(
        eventIdForCritiqueTest!,
        TEST_TIMEOUT_MS - 5000
      )

      expect(result).toBeDefined()
      expect(result).not.toBeNull()
      expect(result.error).toBeNull()

      const finalState = result.finalState
      expect(finalState).toBeDefined()
      expect(finalState.status).toBe(
        NetworkStatus.Enum.NEEDS_REQUIREMENTS_CRITIQUE
      )
      expect(finalState.task).toBe(DEFAULT_EVENT_DATA.input)
      expect(finalState.test_requirements).toBeDefined()
    },
    TEST_TIMEOUT_MS
  )
  // -------------------------------------------

  // Пока закомментируем остальные тесты, чтобы сфокусироваться на первом шаге
  /*
  it("should transition from NEEDS_TEST to NEEDS_CODE after manual step", async () => {
    console.log("--- Test: NEEDS_TEST -> NEEDS_CODE ---")
    // ... (rest of the commented out test)
  })
  */
})

// Increase timeout for E2E tests
vi.setConfig({ testTimeout: 180000 }) // 180 seconds

// Mock the DeepSeek API endpoint
// Удаляем импорт несуществующего файла
// import { server } from "../../mocks/node"
