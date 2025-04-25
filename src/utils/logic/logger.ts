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
 * @param level - Log level ('info', 'warn', 'error')
 * @param stepName - Name of the step/context
 * @param message - Log message
 * @param data - Additional data object (optional)
 */
export const log = (
  level: "info" | "warn" | "error",
  stepName: string,
  message: string,
  data: object = {} // Revert back to object
) => {
  // Access sandboxId safely from the typed data object
  const currentSandboxId = (data as any).sandboxId || null // Keep the `any` assertion for now

  console.log(
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        level,
        step: stepName,
        sandboxId: currentSandboxId,
        message,
        ...data, // Spread the rest of the data
      },
      null,
      2 // Pretty print JSON
    )
  )
}
