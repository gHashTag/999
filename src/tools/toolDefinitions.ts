// src/tools/toolDefinitions.ts
import { z } from "zod"
import type { GetSandboxFunc } from "@/inngest"
// import type { Sandbox } from "@e2b/code-interpreter"; // REMOVED: Unused import
import type { LoggerFunc } from "@/types/agents"
// import { log } from "@/utils/logic/logger"; // REMOVED: Unused import

// --- Tool Schema Definitions (Kept Here For Now) --- //
// TODO: Consider moving schemas to a dedicated src/tools/schemas.ts file
export const terminalParamsSchema = z.object({ command: z.string() })
export const createOrUpdateFilesParamsSchema = z.object({
  files: z.array(z.object({ path: z.string(), content: z.string() })),
})
export const readFilesParamsSchema = z.object({ files: z.array(z.string()) })
export const runCodeParamsSchema = z.object({ code: z.string() })
export const processArtifactParamsSchema = z.object({
  artifactPath: z.string().describe("Local path to the .tar.gz artifact file"),
  fileToRead: z
    .string()
    .describe("Path to the file to read inside the archive (e.g., 'test.js')"),
})
// Schema for askHumanForInput is defined within its own file now.

// --- Import All Tool Creators --- //
// Assuming definitions/index.ts exports all these correctly
import {
  createTerminalTool,
  createCreateOrUpdateFilesTool, // Prefixed unused import
  createReadFilesTool, // Prefixed unused import
  createRunCodeTool, // Prefixed unused import
  createProcessArtifactTool, // Prefixed unused import
  createAskHumanForInputTool,
} from "./definitions" // Use index import

/**
 * Function to get all defined tools.
 * @param log - The logging function.
 * @param getSandbox - Async function to get a sandbox instance. Needs correct type.
 * @param eventId - The current event ID.
 * @param sandboxId - The current sandbox ID (can be null initially).
 * @returns An array of tools.
 */
export function getAllTools(
  log: LoggerFunc,
  getSandbox: GetSandboxFunc,
  eventId: string,
  sandboxId: string | null
) {
  // Remove deps object

  // Define tools using their respective creation functions with individual args
  // Assuming createTerminalTool now expects log, getSandbox, eventId, sandboxId
  const terminalTool = createTerminalTool(log, getSandbox, eventId, sandboxId)
  // Assuming createHumanInputTool now expects log, eventId
  const askHumanTool = createAskHumanForInputTool(log, eventId)

  // Add more tools here as needed, passing correct arguments
  const fileTool = createCreateOrUpdateFilesTool(
    log,
    getSandbox,
    eventId,
    sandboxId
  )
  const readFileTool = createReadFilesTool(log, getSandbox, eventId, sandboxId)
  const runCodeTool = createRunCodeTool(log, eventId, sandboxId) // Needs getSandbox? Check definition
  const processArtifactTool = createProcessArtifactTool(log, eventId, sandboxId) // Needs getSandbox? Check definition

  return [
    terminalTool,
    askHumanTool,
    fileTool,
    readFileTool,
    runCodeTool,
    processArtifactTool,
  ]
}
