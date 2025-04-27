// import { z } from "zod" // Removed unused import
import { createTool } from "@inngest/agent-kit"
// import type { LoggerFunc } from "@/types/agents"
import type { HandlerLogger } from "@/types/agents"
// Corrected import path
import { getSandbox } from "@/inngest/utils/sandboxUtils"
import { terminalParamsSchema } from "@/tools/schemas"

// Define a type for the Sandbox function expected by the tool
// It should accept a sandbox ID and return a Promise resolving to a Sandbox instance or null
// This matches the signature of getSandbox imported above
// type GetSandboxFunc = (sandboxId: string) => Promise<Sandbox | null>; // Removed, using imported getSandbox directly

export function createTerminalTool(
  log: HandlerLogger,
  getSandboxFunc: typeof getSandbox, // Use the type of the imported function
  eventId: string,
  sandboxId: string | null
) {
  return createTool({
    name: "runTerminalCommand",
    description: "Runs a terminal command in the sandbox.",
    parameters: terminalParamsSchema,
    handler: async params => {
      const currentSandboxId = sandboxId
      try {
        log.info(`TOOL_RUN: Running terminal tool for event ${eventId}`, {
          toolName: "terminal",
          parameters: params,
          eventId: eventId,
        })

        if (!currentSandboxId)
          throw new Error("Sandbox ID is null for terminal tool")
        const sandbox = await getSandboxFunc(currentSandboxId)
        if (!sandbox)
          throw new Error(`Sandbox not found for ID: ${currentSandboxId}`)

        const { command } = params
        log.info(`TERMINAL_TOOL_EXECUTE: Executing command: ${command}`, {
          sandboxId,
          command,
          eventId: eventId,
        })
        const exec = await sandbox.commands.run(command)

        const output = {
          stdout: exec.stdout,
          stderr: exec.stderr,
        }

        log.info(`TOOL_OUTPUT: Terminal tool output for event ${eventId}`, {
          toolName: "terminal",
          output,
          eventId: eventId,
        })
        return output
      } catch (error: unknown) {
        // Use unknown instead of any
        let errorMessage = "Unknown error"
        if (error instanceof Error) {
          errorMessage = error.message
        } else if (typeof error === "string") {
          errorMessage = error
        }
        log.error(`TOOL_ERROR: Terminal tool error for event ${eventId}`, {
          toolName: "terminal",
          error: errorMessage, // Log the extracted message
          eventId: eventId,
        })
        // Rethrowing might be better handled by returning an error object
        // throw error as unknown
        return { error: errorMessage } // Return an error object instead
      }
    },
  })
}
