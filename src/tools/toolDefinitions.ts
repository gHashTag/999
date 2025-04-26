// src/tools/toolDefinitions.ts
import { z } from "zod"
import type { GetSandboxFunc } from "@/inngest/logic/utils"
import type { AnyTool, HandlerLogger } from "@/types/agents"

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
import {
  createTerminalTool,
  createCreateOrUpdateFilesTool,
  createReadFilesTool,
  createRunCodeTool,
  createProcessArtifactTool,
  createAskHumanForInputTool,
} from "./definitions"

/**
 * Function to get all defined tools.
 * @param log - The logging function.
 * @param getSandbox - Async function to get a sandbox instance.
 * @param eventId - The current event ID.
 * @param sandboxId - The current sandbox ID (can be null initially).
 * @returns An array of tools.
 */
export function getAllTools(
  log: HandlerLogger,
  getSandbox: GetSandboxFunc,
  eventId: string,
  sandboxId: string | null
): AnyTool[] {
  // Define tools using their respective creation functions
  const terminalTool = createTerminalTool(log, getSandbox, eventId, sandboxId)
  const askHumanTool = createAskHumanForInputTool(log, eventId)
  const fileTool = createCreateOrUpdateFilesTool(
    log,
    getSandbox,
    eventId,
    sandboxId
  )
  const readFileTool = createReadFilesTool(log, getSandbox, eventId, sandboxId)
  const runCodeTool = createRunCodeTool(log, eventId, sandboxId)
  const processArtifactTool = createProcessArtifactTool(log, eventId, sandboxId)

  return [
    terminalTool,
    askHumanTool,
    fileTool,
    readFileTool,
    runCodeTool,
    processArtifactTool,
  ]
}
