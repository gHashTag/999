import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import chalk from "chalk" // Import chalk

// Determine the project root relative to the current file using import.meta.url
const __filename = fileURLToPath(import.meta.url)
// ESM compatible way to get directory name:
const currentDir = path.dirname(__filename)
// Resolve project root assuming logger.ts is in src/utils/logic/
const projectRoot = path.resolve(currentDir, "../../../")

const logFilePath = path.join(projectRoot, "node-app.log")
// Remove E2E log file path
// const e2eLogFilePath = path.join(projectRoot, "src/logs/e2e-test-run.log")

// Ensure the main logs directory exists (project root)
// const logsDir = path.dirname(e2eLogFilePath) // No longer needed
// if (!fs.existsSync(logsDir)) { // No longer needed
//   fs.mkdirSync(logsDir, { recursive: true }) // No longer needed
// }

// FIX: Remove problematic import
// import { sandboxId } from "../index.js"; // Assuming sandboxId is accessible globally or passed differently

// TODO: Improve how sandboxId is accessed. Maybe pass it to the log function?

// Define a type for the optional data payload
// interface LogData {
//   sandboxId?: string | null;
//   [key: string]: unknown; // Allow other properties
// }

// Define color mapping for levels
const levelColors = {
  info: chalk.blue,
  warn: chalk.yellow,
  error: chalk.red,
}

/**
 * Simple file logger.
 * Writes structured logs to node-app.log.
 */
export const log = (
  level: "info" | "warn" | "error",
  stepName: string,
  message: string,
  data: Record<string, any> = {} // Keep data flexible
) => {
  // Remove isE2ETestContext logic
  const currentSandboxId = data?.sandboxId || null

  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    step: stepName,
    sandboxId: currentSandboxId,
    // Remove isE2ETestContext field
    message,
    ...data,
  }

  // Stringify once for the file log
  const logStringForFile = JSON.stringify(logEntry, null, 2)

  // Log to console with colors
  const color = levelColors[level] || chalk.white
  const consoleTimestamp = chalk.gray(`[${logEntry.timestamp}]`)
  const consoleLevel = color.bold(`[${level.toUpperCase()}]`)
  const consoleStep = chalk.cyan(`[${stepName}]`)
  const consoleSandbox = logEntry.sandboxId
    ? chalk.magenta(`[Sandbox: ${logEntry.sandboxId}]`)
    : ""
  const consoleMessage = color(message)
  // Optionally log data to console in a simplified way or keep it out
  // const consoleData = Object.keys(data).length > 0 ? chalk.dim(` ${JSON.stringify(data)}`) : '';
  console.log(
    `${consoleTimestamp} ${consoleLevel} ${consoleStep}${consoleSandbox} ${consoleMessage}`
  ) // Removed consoleData for cleaner output

  // Append to main log file ONLY
  try {
    fs.appendFileSync(logFilePath, logStringForFile + "\n", "utf-8")
  } catch (err) {
    // Use chalk for the critical error message in console too
    console.error(
      chalk.red.bold(
        `[LOGGER CRITICAL ERROR] Failed to write to MAIN log file ${logFilePath}:`
      ),
      err
    )
  }

  // Remove conditional E2E log writing block
}
