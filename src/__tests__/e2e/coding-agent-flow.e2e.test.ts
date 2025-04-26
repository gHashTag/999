/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-extra-semi */
/* eslint-disable no-console */
import { describe, it, expect, beforeAll, afterAll } from "vitest"
// Удаляем импорты spawn и fetch, так как они теперь в utils.ts
// import { spawn } from "child_process"

// import fetch from "node-fetch" // Переехал в utils.ts
// import { AbortController } from 'node-abort-controller'; // Переехал в utils.ts

// Импортируем наши утилиты
import {
  // waitForUrl, // Removed unused import
  // runCommand, // Removed unused import
  sendInngestEvent,
  clearTestLogFile,
  readTestLogFile,
} from "./utils"
// import { NetworkStatus } from "../../types/network"

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

// eslint-disable-next-line prefer-const
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
  // Очистка выполняется один раз перед всеми тестами
  beforeAll(async () => {
    console.log(
      "Skipping E2E test setup: Assuming servers are already running."
    )
    // Clear the specific test log file
    clearTestLogFile()
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
    await new Promise(resolve => setTimeout(resolve, 2000))
  }, 15000)

  // Шаг 5: Проверка, что обработчик события был вызван
  it(
    "should eventually log a FINAL_STATE_LOGGING with status COMPLETED",
    async () => {
      await expect
        .poll(() => readTestLogFile(), {
          timeout: TEST_TIMEOUT_MS - 5000,
          interval: 2000,
        })
        .toMatch(/FINAL_STATE_LOGGING.*status.+COMPLETED/)

      console.log("Agent network completed successfully with status COMPLETED.")
    },
    TEST_TIMEOUT_MS
  )

  // Раскомментируем и адаптируем этот тест
  it(
    "should handle initial add(a,b) task and reach NEEDS_REQUIREMENTS_CRITIQUE state",
    async () => {
      console.log("--- Test: Initial Task -> NEEDS_REQUIREMENTS_CRITIQUE ---")
      const eventResponse = await sendInngestEvent(
        DEFAULT_EVENT_NAME,
        DEFAULT_EVENT_DATA
      )
      expect(eventResponse.status).toBe(200)

      // Даем время на обработку и запись логов
      await new Promise(resolve => setTimeout(resolve, 10000)) // Wait 10 seconds

      // Проверяем логи из файла
      console.log("Checking logs for state transition...")
      const logContent = readTestLogFile() // Read from the test log file
      expect(logContent).toMatch(
        /ROUTER_TO_CRITIC.+"status":"NEEDS_REQUIREMENTS_CRITIQUE"/
      )
    },
    TEST_TIMEOUT_MS // Use the defined timeout
  )

  // Пока закомментируем остальные тесты, чтобы сфокусироваться на первом шаге
  /*
  it("should transition from NEEDS_TEST to NEEDS_CODE after manual step", async () => {
    console.log("--- Test: NEEDS_TEST -> NEEDS_CODE ---")
    // ... (rest of the commented out test)
  })
  */
})
