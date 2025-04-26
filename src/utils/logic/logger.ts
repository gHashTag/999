import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

// Determine the project root relative to the current file using import.meta.url
const __filename = fileURLToPath(import.meta.url)
// ESM compatible way to get directory name:
const currentDir = path.dirname(__filename)
// Resolve project root assuming logger.ts is in src/utils/logic/
const projectRoot = path.resolve(currentDir, "../../../")

const logFilePath = path.join(projectRoot, "node-app.log")
// Define path for the E2E test log file
const e2eLogFilePath = path.join(projectRoot, "logs/e2e-test-run.log")

// Ensure the logs directory exists
const logsDir = path.dirname(e2eLogFilePath)
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

// FIX: Remove problematic import
// import { sandboxId } from "../index.js"; // Assuming sandboxId is accessible globally or passed differently

// TODO: Improve how sandboxId is accessed. Maybe pass it to the log function?

// Define a type for the optional data payload
// interface LogData {
//   sandboxId?: string | null;
//   [key: string]: unknown; // Allow other properties
// }

/**
 * Helper for structured logging.
 * Writes to both console and node-app.log file.
 * @param level - Log level ('info', 'warn', 'error')
 * @param stepName - Name of the step/context
 * @param message - Log message
 * @param data - Additional data object (optional)
 */
export const log = (
  level: "info" | "warn" | "error",
  stepName: string,
  message: string,
  data: object = {}
) => {
  const currentSandboxId = (data as any).sandboxId || null

  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    step: stepName,
    sandboxId: currentSandboxId,
    message,
    ...data,
  }

  const logString = JSON.stringify(logEntry, null, 2)

  // Log to console
  console.log(logString)

  // Append to main log file
  try {
    fs.appendFileSync(logFilePath, logString + "\n", "utf-8")
  } catch (err) {
    // Log error writing to file *only* to console to avoid infinite loop
    console.error(
      `[Logger Error] Failed to write to main log file ${logFilePath}:`,
      err
    )
  }

  // Append to E2E test log file if in test environment
  if (process.env.NODE_ENV === "test") {
    try {
      fs.appendFileSync(e2eLogFilePath, logString + "\n", "utf-8")
    } catch (err) {
      console.error(
        `[Logger Error] Failed to write to E2E test log file ${e2eLogFilePath}:`,
        err
      )
    }
  }
}
