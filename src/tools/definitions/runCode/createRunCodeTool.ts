// import { z } from "zod"
import { createTool } from "@inngest/agent-kit"
import type { LoggerFunc } from "@/types/agents"
import { getSandbox } from "@/inngest/logic/utils"
import { runCodeParamsSchema } from "@/tools/schemas"

export function createRunCodeTool(
  log: LoggerFunc,
  eventId: string,
  sandboxId: string | null
) {
  return createTool({
    name: "runCode",
    description:
      "Executes arbitrary code (e.g., shell script, Python, Node.js) in the sandbox.",
    parameters: runCodeParamsSchema,
    handler: async params => {
      const currentSandboxId = sandboxId
      const toolStepName = "TOOL_runCode"
      log("info", `${toolStepName}_START`, "Running code.", {
        eventId,
        currentSandboxId,
      })

      try {
        if (!currentSandboxId)
          throw new Error("Sandbox ID is null for runCode tool")
        const sandbox = await getSandbox(currentSandboxId)
        if (!sandbox)
          throw new Error(`Sandbox not found for ID: ${currentSandboxId}`)
        log(
          "info",
          `${toolStepName}_EXEC_START`,
          "Executing code in sandbox.",
          {
            eventId,
            currentSandboxId,
            codeLength: params.code.length,
          }
        )
        // TODO: Verify this is the correct method on the latest E2B SDK
        // const process = await sandbox.process.start({ cmd: params.code })
        // const result = await process.wait()
        // Возвращаемся к использованию commands.run, как в terminal
        const result = await sandbox.commands.run(params.code)

        log("info", `${toolStepName}_EXEC_END`, "Code execution finished.", {
          eventId,
          currentSandboxId,
          exitCode: result.exitCode,
          stdoutLen: result.stdout.length,
          stderrLen: result.stderr.length,
        })
        return {
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode,
        }
      } catch (e: unknown) {
        let errorMessage = "Unknown runCode error"
        let errorStack = undefined
        if (e instanceof Error) {
          errorMessage = e.message
          errorStack = e.stack
        } else if (typeof e === "string") {
          errorMessage = e
        }
        log("error", `${toolStepName}_ERROR`, "Error running code.", {
          eventId,
          currentSandboxId,
          error: errorMessage,
          stack: errorStack,
        })
        return { error: `Code execution failed: ${errorMessage}` }
      }
    },
  })
}
