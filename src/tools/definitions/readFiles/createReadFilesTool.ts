// import { z } from "zod"
import { createTool } from "@inngest/agent-kit"
// import type { LoggerFunc } from "@/types/agents"
import type { HandlerLogger } from "@/types/agents"
import { getSandbox } from "@/inngest/utils/sandboxUtils"
import { readFilesParamsSchema } from "@/tools/schemas"

export function createReadFilesTool(
  log: HandlerLogger,
  getSandboxFunc: typeof getSandbox,
  eventId: string,
  sandboxId: string | null
) {
  return createTool({
    name: "readFiles",
    description: "Read files from the sandbox",
    parameters: readFilesParamsSchema,
    handler: async params => {
      const currentSandboxId = sandboxId
      const toolStepName = "TOOL_readFiles"
      log.info(`${toolStepName}_START: Reading files.`, {
        eventId,
        currentSandboxId,
        files: params.files,
      })

      const filesData: Array<{
        path: string
        content: string
        error?: string
      }> = []
      try {
        if (!currentSandboxId)
          throw new Error("Sandbox ID is null for readFiles tool")
        const sandbox = await getSandboxFunc(currentSandboxId)
        if (!sandbox)
          throw new Error(`Sandbox not found for ID: ${currentSandboxId}`)

        for (const filePath of params.files) {
          try {
            log.info(`${toolStepName}_READ_START: Reading file.`, {
              eventId,
              currentSandboxId,
              filePath,
            })
            const content = await sandbox.files.read(filePath)
            filesData.push({ path: filePath, content })
            log.info(`${toolStepName}_READ_SUCCESS: File read successfully.`, {
              eventId,
              currentSandboxId,
              filePath,
              length: content.length,
            })
          } catch (readError: unknown) {
            let errorMessage = "Unknown read error"
            if (readError instanceof Error) {
              errorMessage = readError.message
            } else if (typeof readError === "string") {
              errorMessage = readError
            }
            log.error(`${toolStepName}_READ_ERROR: Failed to read file.`, {
              eventId,
              currentSandboxId,
              filePath,
              error: errorMessage,
            })
            filesData.push({ path: filePath, content: "", error: errorMessage })
          }
        }
        log.info(`${toolStepName}_SUCCESS: Finished reading files.`, {
          eventId,
          currentSandboxId,
        })
        return { files: filesData }
      } catch (e: unknown) {
        let errorMessage = "Unknown readFiles error"
        let errorStack = undefined
        if (e instanceof Error) {
          errorMessage = e.message
          errorStack = e.stack
        } else if (typeof e === "string") {
          errorMessage = e
        }
        log.error(`${toolStepName}_ERROR: Error in readFiles tool.`, {
          eventId,
          currentSandboxId,
          error: errorMessage,
          stack: errorStack,
        })
        return { error: `Tool failed: ${errorMessage}`, files: filesData }
      }
    },
  })
}
