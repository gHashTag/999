import fs from "fs"
import path from "path"
import chalk from "chalk"

// Determine log file path (relative to project root)
const logDirectory = path.join(__dirname, "../../src/logs") // Go up two levels from dist/utils/logic
const logFilePath = path.join(logDirectory, "node-app.log")

// Ensure log directory exists
try {
  if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true })
  }
} catch (err) {
  console.error(
    chalk.red.bold(
      `[LOGGER INIT CRITICAL ERROR] Failed to create log directory ${logDirectory}:`
    ),
    err
  )
}

// Define colors for console output
const levelColors = {
  info: chalk.blue,
  warn: chalk.yellow,
  error: chalk.red,
}

// Define valid log levels
export type LogLevel = "info" | "warn" | "error"

/**
 * Simple file logger.
 * Writes structured logs to node-app.log.
 */
export const log = (
  level: LogLevel,
  stepName: string,
  message: string,
  data: Record<string, any> = {}
) => {
  const currentSandboxId = data?.sandboxId || null

  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    step: stepName,
    sandboxId: currentSandboxId,
    message,
    ...data,
  }

  const logStringForFile = JSON.stringify(logEntry, null, 2)

  const color = levelColors[level] || chalk.white
  const consoleTimestamp = chalk.gray(`[${logEntry.timestamp}]`)
  const consoleLevel = color.bold(`[${level.toUpperCase()}]`)
  const consoleStep = chalk.cyan(`[${stepName}]`)
  const consoleSandbox = logEntry.sandboxId
    ? chalk.magenta(`[Sandbox: ${logEntry.sandboxId}]`)
    : ""
  const consoleMessage = color(message)
  console.log(
    `${consoleTimestamp} ${consoleLevel} ${consoleStep}${consoleSandbox} ${consoleMessage}`
  )

  try {
    fs.appendFileSync(logFilePath, logStringForFile + "\n", "utf-8")
  } catch (err) {
    console.error(
      chalk.red.bold(
        `[LOGGER CRITICAL ERROR] Failed to write to MAIN log file ${logFilePath}:`
      ),
      err
    )
  }
}
