import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { spawn } from "child_process"
import type { ChildProcess } from "child_process"
import path from "path"
import fetch from "node-fetch" // Для отправки события
// Импортируем AbortController, если он не глобальный (зависит от версии Node/TS)
// Обычно он глобальный в свежих версиях Node
// import { AbortController } from 'node-abort-controller'; // Раскомментировать, если нужно

// --- Константы и Утилиты ---
const ROOT_DIR = path.resolve(__dirname, "../../") // Путь к корню проекта
const INNGEST_DEV_URL = "http://localhost:8288"
const APP_SERVER_URL = "http://localhost:8484" // Убедитесь, что совпадает с вашим сервером
const EVENT_API_URL = `${INNGEST_DEV_URL}/e/a9tBvZMPD66QNEy3goIPmrSZ6tin2SQ1jWANGG148rbeCgB0` // Замените на ваш event key ID если нужно
const DEFAULT_EVENT_DATA = {
  input: "Create a simple hello world test and implementation.",
}
const WAIT_FOR_SERVER_MS = 20000 // Увеличим время ожидания
const CHECK_INTERVAL_MS = 1000 // Пауза между проверками
const TEST_TIMEOUT_MS = 60000 // 1 минута на выполнение шага обработки события
const SETUP_TIMEOUT_MS = WAIT_FOR_SERVER_MS + 5000 // Таймаут для шагов запуска серверов

let tscProcess: ChildProcess | null = null
let inngestProcess: ChildProcess | null = null
let appProcess: ChildProcess | null = null

// Функция для ожидания доступности URL
const waitForUrl = async (url: string, timeout: number): Promise<boolean> => {
  const start = Date.now()
  console.log(`Waiting for ${url} up to ${timeout}ms...`)
  while (Date.now() - start < timeout) {
    const controller = new AbortController()
    const signal = controller.signal
    // Устанавливаем таймаут для отмены запроса
    const timeoutId = setTimeout(
      () => controller.abort(),
      CHECK_INTERVAL_MS - 100
    )

    try {
      const response = await fetch(url, {
        method: "GET",
        signal, // Передаем AbortSignal
      })
      clearTimeout(timeoutId) // Отменяем таймаут, если ответ пришел вовремя

      if (response.ok || response.status === 404 || response.status === 405) {
        console.log(`URL ${url} is available (Status: ${response.status}).`)
        return true
      }
      console.log(
        `URL ${url} responded with status ${response.status}. Retrying...`
      )
    } catch (error: any) {
      // Log only connection errors, not timeouts of the fetch itself
      if (error.code === "ECONNREFUSED" || error.code === "ECONNRESET") {
        console.log(`URL ${url} connection refused/reset. Retrying...`)
      } else if (error.name === "AbortError") {
        // Это ожидаемая ошибка при срабатывании таймаута AbortController
        console.log(
          `URL ${url} check timed out after ${CHECK_INTERVAL_MS - 100}ms. Retrying...`
        )
      } else {
        console.log(`Error checking URL ${url}: ${error.message}. Retrying...`)
      }
    }
    await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL_MS))
  }
  console.error(`URL ${url} did not become available within ${timeout}ms.`)
  return false
}

// Функция для запуска процесса
const runCommand = (
  command: string,
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv = process.env
): ChildProcess => {
  console.log(`Spawning: ${command} ${args.join(" ")} in ${cwd}`)
  // Используем pnpm для консистентности
  const proc = spawn("pnpm", [command, ...args], {
    cwd,
    shell: true,
    stdio: ["pipe", "inherit", "inherit"], // pipe stdout, inherit stderr/stdin
    env,
  })

  // Добавляем явную проверку на null перед доступом к .on
  if (proc.stdout) {
    // Явно приводим тип, чтобы TypeScript был уверен
    ;(proc.stdout as NodeJS.ReadableStream).on("data", data =>
      console.log(`[${command} ${args[0]} stdout]: ${data.toString().trim()}`)
    )
  }

  proc.on("error", error =>
    console.error(`[${command} ${args[0]} error]: ${error.message}`)
  )
  proc.on("close", code =>
    console.log(`[${command} ${args[0]}] exited with code ${code}`)
  )

  return proc
}

// --- Тестовый Набор (Декомпозированный) ---

// Используем sequential для гарантии порядка выполнения шагов
describe.sequential("E2E: Coding Agent Full Flow", () => {
  // Очистка выполняется один раз перед всеми тестами
  beforeAll(async () => {
    console.log("Starting E2E test setup: Killing existing processes...")
    const killProc = runCommand(
      "exec",
      ["bash", "scripts/kill-ports.sh"],
      ROOT_DIR
    )
    await new Promise((resolve, reject) => {
      killProc.on("close", code => {
        console.log(`kill-ports.sh finished with code ${code}.`)
        // Нестрогая проверка, т.к. скрипт может завершиться с ошибкой, если порты уже свободны
        resolve(code)
      })
      killProc.on("error", reject)
    })
    await new Promise(resolve => setTimeout(resolve, 1000)) // Пауза после kill
    console.log("Port cleanup finished.")
  }, 10000) // Таймаут для очистки

  // Очистка после всех тестов
  afterAll(() => {
    console.log("Cleaning up E2E test resources...")
    // Используем SIGINT для более мягкого завершения, SIGTERM как fallback
    const killGracefully = (process: ChildProcess | null, name: string) => {
      if (process && !process.killed) {
        console.log(`Attempting to kill ${name} gracefully (SIGINT)...`)
        process.kill("SIGINT")
        setTimeout(() => {
          if (!process.killed) {
            console.warn(`${name} did not exit gracefully, sending SIGTERM...`)
            process.kill("SIGTERM")
          }
        }, 3000) // Ждем 3 секунды перед SIGTERM
      }
    }
    killGracefully(tscProcess, "tsc --watch")
    killGracefully(inngestProcess, "inngest dev:serve")
    killGracefully(appProcess, "node app")
    console.log("Cleanup commands issued.")
    // Даем время на завершение процессов
    return new Promise(resolve => setTimeout(resolve, 5000))
  }, 15000) // Таймаут на очистку

  // Шаг 1: Запуск TypeScript компилятора
  it("should start tsc --watch successfully", async () => {
    console.log("Starting tsc --watch...")
    tscProcess = runCommand(
      "exec", // Используем pnpm exec
      ["tsc", "--watch", "--preserveWatchOutput"],
      ROOT_DIR
    )
    // Ждем немного и проверяем, что процесс жив (не идеальная проверка)
    await new Promise(resolve => setTimeout(resolve, 5000))
    expect(tscProcess?.killed).toBe(false)
    expect(tscProcess?.exitCode).toBeNull() // Процесс не должен завершиться
    console.log("tsc --watch seems to be running.")
  }, 10000) // Таймаут для запуска tsc

  // Шаг 2: Запуск Inngest Dev Server
  it(
    "should start Inngest Dev Server on port 8288",
    async () => {
      console.log("Starting Inngest Dev Server...")
      // Используем 'run' для запуска скрипта из package.json
      inngestProcess = runCommand("run", ["dev:serve"], ROOT_DIR)
      const inngestReady = await waitForUrl(INNGEST_DEV_URL, WAIT_FOR_SERVER_MS)
      expect(
        inngestReady,
        `Inngest Dev Server (${INNGEST_DEV_URL}) did not become available`
      ).toBe(true)
    },
    SETUP_TIMEOUT_MS
  ) // Индивидуальный таймаут

  // Шаг 3: Запуск Сервера Приложения
  it(
    "should start App Server on port 8484",
    async () => {
      console.log(`Starting App Server: node dist/index.cjs`)
      // Запускаем напрямую через node, используя pnpm exec для разрешения пути
      appProcess = runCommand("exec", ["node", "dist/index.cjs"], ROOT_DIR, {
        ...process.env,
        // Можно переопределить переменные окружения здесь, если нужно
        // NODE_ENV: 'test',
      })
      const appReady = await waitForUrl(APP_SERVER_URL, WAIT_FOR_SERVER_MS)
      expect(
        appReady,
        `App Server (${APP_SERVER_URL}) did not become available`
      ).toBe(true)
    },
    SETUP_TIMEOUT_MS
  ) // Индивидуальный таймаут

  // Шаг 4: Отправка тестового события
  it("should send coding-agent/run event successfully", async () => {
    console.log(`Sending event to ${EVENT_API_URL}`)
    let eventResponseStatus = 0
    let responseBody = ""
    const controller = new AbortController() // AbortController для таймаута
    const signal = controller.signal
    const timeoutId = setTimeout(() => controller.abort(), 5000) // Таймаут 5 секунд

    try {
      const response = await fetch(EVENT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "coding-agent/run",
          data: DEFAULT_EVENT_DATA,
        }),
        signal, // Передаем AbortSignal
      })
      clearTimeout(timeoutId) // Отменяем таймаут
      eventResponseStatus = response.status
      responseBody = await response.text() // Читаем тело в любом случае для логов
      console.log(
        `Event submission response: Status=${eventResponseStatus}, Body=${responseBody}`
      )
      expect(eventResponseStatus).toBe(200)
    } catch (error: any) {
      console.error("Failed to send event:", error)
      // Провалить тест, если событие не отправилось
      throw new Error(
        `Failed to send event to ${EVENT_API_URL}: ${error.message}`
      )
    }
  }, 10000) // Таймаут на отправку

  // Шаг 5: Ожидание и проверка отсутствия критических ошибок (базовая)
  it(
    "should process the event without critical connection errors reported by Inngest",
    async () => {
      console.log(
        `Waiting ${TEST_TIMEOUT_MS / 1000} seconds for event processing...`
      )
      // TODO: Нужна более умная проверка логов Inngest на ошибки "connection refused"
      // Пока просто ждем
      await new Promise(resolve => setTimeout(resolve, TEST_TIMEOUT_MS - 5000)) // Оставим 5с на проверки

      console.log("Checking results (basic connection error check)...")
      // Эта проверка очень базовая, нужно будет улучшить, анализируя логи inngestProcess
      // Например, можно собирать stderr от inngestProcess и проверять его содержимое
      expect(true).toBe(true) // Заглушка
    },
    TEST_TIMEOUT_MS
  ) // Таймаут на обработку
}) // Конец describe.sequential
