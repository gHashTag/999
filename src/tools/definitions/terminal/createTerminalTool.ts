// import { z } from "zod"
import { createTool } from "@inngest/agent-kit"
// import type { LoggerFunc } from "@/utils/logic/logger"; // WRONG import
import type { LoggerFunc } from "@/types/agents" // CORRECT import
import type { GetSandboxFunc } from "@/inngest" // CORRECT type alias import
import { terminalParamsSchema } from "@/tools/schemas"

// Импортируем схему из общего файла (пока он еще существует)
// import { terminalParamsSchema } from "../../toolDefinitions"

export function createTerminalTool(
  log: LoggerFunc, // Use type of imported log function
  getSandboxFunc: GetSandboxFunc, // Use the imported type alias
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
        log("info", "TOOL_RUN", `Running terminal tool for event ${eventId}`, {
          toolName: "terminal",
          parameters: params,
        })

        if (!currentSandboxId)
          throw new Error("Sandbox ID is null for terminal tool")
        const sandbox = await getSandboxFunc(currentSandboxId)
        if (!sandbox)
          throw new Error(`Sandbox not found for ID: ${currentSandboxId}`)

        const { command } = params
        log("info", "TERMINAL_TOOL_EXECUTE", `Executing command: ${command}`, {
          sandboxId,
          command,
        })
        const exec = await sandbox.commands.run(command)

        const output = {
          stdout: exec.stdout,
          stderr: exec.stderr,
        }

        log(
          "info",
          "TOOL_OUTPUT",
          `Terminal tool output for event ${eventId}`,
          {
            toolName: "terminal",
            output,
          }
        )
        return output
      } catch (error: unknown) {
        // Use unknown instead of any
        let errorMessage = "Unknown error"
        if (error instanceof Error) {
          errorMessage = error.message
        } else if (typeof error === "string") {
          errorMessage = error
        }
        log("error", "TOOL_ERROR", `Terminal tool error for event ${eventId}`, {
          toolName: "terminal",
          error: errorMessage, // Log the extracted message
        })
        // Rethrowing might be better handled by returning an error object
        // throw error as unknown
        return { error: errorMessage } // Return an error object instead
      }
    },
  })
}
