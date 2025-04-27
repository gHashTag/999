/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */

import { spawn } from "child_process"
import type { ChildProcess } from "child_process"
import fetch from "node-fetch"
import { AbortController } from "node-abort-controller" // Импортируем AbortController
// Remove path and fs imports as they are no longer needed
// import path from "node:path" // Add path import
// import fs from "node:fs" // Add fs import

// Константа, используемая в waitForUrl
const CHECK_INTERVAL_MS = 1000

// Remove unused constants
// const INNGEST_DEV_URL = "http://localhost:8288"
// const EVENT_KEY_ID = "a9tBvZMPD66QNEy3goIPmrSZ6tin2SQ1jWANGG148rbeCgB0"
// const EVENT_API_URL = `${INNGEST_DEV_URL}/e/${EVENT_KEY_ID}`
// const projectRoot = path.resolve(__dirname, "../../../")
// const appLogFilePath = path.join(projectRoot, "node-app.log")

// Remove unused log file functions
/* // Keep this comment if needed
export const readAndParseAppLog = (linesToRead = 200): any[] => {
  // ... implementation ...
}
*/ // Keep this comment if needed

// FIX: Uncomment sendInngestEvent function
// Remove unused sendInngestEvent function // <- Remove this comment line
// * // <- Remove this line
export async function sendInngestEvent(
  eventName: string,
  eventData: Record<string, unknown>,
  apiUrl = "http://localhost:8288/e/a9tBvZMPD66QNEy3goIPmrSZ6tin2SQ1jWANGG148rbeCgB0"
) {
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([{ name: eventName, data: eventData }]),
    })
    const body = await response.text()
    return { status: response.status, body }
  } catch (error: any) {
    console.error(`Error sending Inngest event ${eventName}:`, error)
    return { status: 500, body: error.message }
  }
}
// */ // <- Remove this line

// FIX: Uncomment pollInngestRunResult function
// Remove unused pollInngestRunResult function // <- Remove this comment line
// * // <- Remove this line
export const pollInngestRunResult = async (
  runId: string,
  timeoutMs: number = 120000, // Default timeout 2 minutes
  pollIntervalMs: number = 2000, // Poll every 2 seconds
  apiUrl = "http://localhost:8288"
): Promise<any | null> => {
  const startTime = Date.now()
  const runApiUrl = `${apiUrl}/v1/runs/${runId}`

  console.log(
    `Polling for result of run ${runId} at ${runApiUrl} for ${timeoutMs}ms...`
  )

  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await fetch(runApiUrl)
      if (response.ok) {
        const runData: unknown = await response.json()
        if (
          typeof runData === "object" &&
          runData !== null &&
          "status" in runData &&
          typeof runData.status === "string"
        ) {
          if (
            runData.status === "COMPLETED" ||
            runData.status === "FAILED" ||
            runData.status === "CANCELLED"
          ) {
            console.log(
              `Run ${runId} finished with status: ${runData.status} after ${
                (Date.now() - startTime) / 1000
              }s`
            )
            // Attempt to parse output JSON if it exists and is a string
            let finalState = null
            if (
              typeof runData === "object" &&
              runData !== null &&
              "output" in runData &&
              runData.output &&
              typeof runData.output === "string"
            ) {
              try {
                finalState = JSON.parse(runData.output)
              } catch (e) {
                console.warn(
                  `Failed to parse run output JSON for run ${runId}: ${e}. Output was: ${
                    runData.output
                  }`
                )
                finalState = { rawOutput: runData.output } // Return raw if parsing fails
              }
            } else if (
              typeof runData === "object" &&
              runData !== null &&
              "output" in runData
            ) {
              finalState = (runData as { output: any }).output // Assign directly if not a string or null/undefined
            }
            const errorResult =
              typeof runData === "object" &&
              runData !== null &&
              "error" in runData
                ? (runData as { error: any }).error
                : undefined
            return {
              status: (runData as { status: string }).status,
              error: errorResult,
              finalState,
            }
          }
          // else: still running, continue polling
        } else {
          console.warn(
            `Polling run ${runId}: Received unexpected data structure.`,
            { runData }
          )
        }
      } else {
        console.warn(
          `Polling run ${runId}: API returned status ${response.status}. Retrying...`
        )
      }
    } catch (error: any) {
      console.error(
        `Polling run ${runId}: Error fetching status - ${error.message}`
      )
    }
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs))
  }

  console.error(`Polling run ${runId} timed out after ${timeoutMs}ms.`)
  return null // Indicate timeout
}
// */ // <- Remove this line

// Keep waitForUrl and runCommand as they might be useful for other E2E tests

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
