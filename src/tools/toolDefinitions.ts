// src/tools/toolDefinitions.ts
// FIX: Remove unused z import
// import { z } from "zod"
import type { GetSandboxFunc } from "@/inngest/utils/sandboxUtils"
import type { HandlerLogger } from "@/types/agents"
// Remove unused createAskHumanForInputTool import
// import { createAskHumanForInputTool } from "./definitions/askHumanForInput"
import { type Tool } from "@inngest/agent-kit"

// --- Import Tool Creators Directly from Subdirectories --- //
import { createTerminalTool } from "./definitions/terminal/createTerminalTool"
// Remove unused createCreateOrUpdateFilesTool import
// import { createCreateOrUpdateFilesTool } from "./definitions/createOrUpdateFiles"
import { someTool } from "./definitions/readFiles/createReadFilesTool"
// Remove unused runCode and processArtifact imports
// import { createRunCodeTool } from "./definitions/runCode"
// import { createProcessArtifactTool } from "./definitions/processArtifact"
import { createUpdateTaskStateTool } from "./definitions/updateTaskStateTool"
// FIX: Remove imports for non-existent tools
// import { createRunCommandTool } from "./definitions/runCommand/createRunCommandTool"
// import { createWriteFilesTool } from "./definitions/writeFiles/createWriteFilesTool"
// import { createWebSearchTool } from "./definitions/webSearch/createWebSearchTool"
// import { createAskHumanTool } from "./definitions/askHuman/createAskHumanTool"

/**
 * Function to get all defined tools.
 */
export function getAllTools(
  log: HandlerLogger,
  getSandbox: GetSandboxFunc,
  eventId: string,
  sandboxId: string | null
): Tool<any>[] {
  // Define tools using their respective creation functions
  const terminalTool = createTerminalTool(log, eventId)
  // FIX: Remove call for non-existent tool
  // const askHumanTool = createAskHumanTool(log, eventId)
  // Remove fileTool (createOrUpdateFiles)
  // const fileTool = createCreateOrUpdateFilesTool(log, getSandbox, eventId, sandboxId)
  // const readFileTool = createReadFilesTool(log, getSandbox, eventId, sandboxId) // Убрали вызов, так как someTool уже создан
  // Remove runCodeTool
  // const runCodeTool = createRunCodeTool(log, eventId, sandboxId)
  // Remove processArtifactTool
  // const processArtifactTool = createProcessArtifactTool(log, eventId, sandboxId)
  const updateStateTool = createUpdateTaskStateTool(log, undefined, eventId)
  // FIX: Remove calls for non-existent tools
  // const runCommandTool = createRunCommandTool(
  //   log,
  //   getSandbox,
  //   eventId,
  //   sandboxId
  // )
  // const writeFilesTool = createWriteFilesTool(
  //   log,
  //   getSandbox,
  //   eventId,
  //   sandboxId
  // )
  // const webSearchTool = createWebSearchTool(log, eventId)

  const tools: Tool<any>[] = [
    terminalTool,
    // askHumanTool, // Removed
    // fileTool, // Removed
    someTool, // Исправлено: добавляем импортированный someTool
    // runCodeTool, // Removed
    // processArtifactTool, // Removed
    updateStateTool,
    // runCommandTool, // Removed
    // writeFilesTool, // Removed
    // webSearchTool, // Removed

    // Placeholder MCP Tools
    // ...
  ]

  return tools
}
