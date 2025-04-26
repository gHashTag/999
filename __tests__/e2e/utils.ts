/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable no-extra-semi */
import { spawn } from "child_process"
import type { ChildProcess } from "child_process"
import fetch from "node-fetch"
import { AbortController } from "node-abort-controller" // Импортируем AbortController
// import { AbortController } from 'node-abort-controller'; // Раскомментировать, если нужно глобально

// Константа, используемая в waitForUrl
const CHECK_INTERVAL_MS = 1000
// --- Константы для sendInngestEvent ---
const INNGEST_DEV_URL = "http://localhost:8288"
// TODO: Вынести в .env?
const EVENT_KEY_ID = "a9tBvZMPD66QNEy3goIPmrSZ6tin2SQ1jWANGG148rbeCgB0" // Временно хардкод
const EVENT_API_URL = `${INNGEST_DEV_URL}/e/${EVENT_KEY_ID}`
const SEND_EVENT_TIMEOUT_MS = 5000 // Таймаут для отправки события

// Функция для ожидания доступности URL
export const waitForUrl = async (
  url: string,
  timeout: number
): Promise<boolean> => {
  const start = Date.now()
  console.log(`Waiting for ${url} up to ${timeout}ms...`)
  while (Date.now() - start < timeout) {
    const controller = new AbortController()
    const signal = controller.signal
    const timeoutId = setTimeout(
      () => controller.abort(),
      CHECK_INTERVAL_MS - 100
    )

    try {
      const response = await fetch(url, {
        method: "GET",
        signal,
      })
      clearTimeout(timeoutId)

      if (response.ok || response.status === 404 || response.status === 405) {
        console.log(`URL ${url} is available (Status: ${response.status}).`)
        return true
      }
      console.log(
        `URL ${url} responded with status ${response.status}. Retrying...`
      )
    } catch (error: any) {
      if (error.code === "ECONNREFUSED" || error.code === "ECONNRESET") {
        console.log(`URL ${url} connection refused/reset. Retrying...`)
      } else if (error.name === "AbortError") {
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
export const runCommand = (
  command: string,
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv = process.env
): ChildProcess => {
  console.log(`Spawning: ${command} ${args.join(" ")} in ${cwd}`)
  const proc = spawn("pnpm", [command, ...args], {
    cwd,
    shell: true,
    stdio: ["pipe", "inherit", "inherit"],
    env,
  })

  if (proc.stdout) {
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

// --- Функция для отправки события Inngest ---
export const sendInngestEvent = async (
  eventName: string,
  eventData: Record<string, any>,
  timeout: number = SEND_EVENT_TIMEOUT_MS
): Promise<{ status: number; body: string }> => {
  console.log(
    `Sending event '${eventName}' to ${EVENT_API_URL} with timeout ${timeout}ms`
  )
  let eventResponseStatus = 0
  let responseBody = ""
  const controller = new AbortController()
  const signal = controller.signal
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(EVENT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: eventName,
        data: eventData,
      }),
      signal,
    })
    clearTimeout(timeoutId)
    eventResponseStatus = response.status
    responseBody = await response.text()
    console.log(
      `Event '${eventName}' submission response: Status=${eventResponseStatus}, Body=${responseBody}`
    )
    return { status: eventResponseStatus, body: responseBody }
  } catch (error: any) {
    clearTimeout(timeoutId)
    console.error(`Failed to send event '${eventName}':`, error)
    throw new Error(
      `Failed to send event '${eventName}' to ${EVENT_API_URL}: ${error.message}`
    )
  }
}
