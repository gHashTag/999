// import { z } from "zod"
import { createTool } from "@inngest/agent-kit"
// import type { LoggerFunc } from "@/types/agents"
import type { HandlerLogger } from "@/types/agents"
import { getSandbox } from "@/inngest/utils/sandboxUtils"
import { createOrUpdateFilesParamsSchema } from "@/tools/schemas"

export function createCreateOrUpdateFilesTool(
  log: HandlerLogger,
  getSandboxFunc: typeof getSandbox,
  eventId: string,
  sandboxId: string | null
) {
  return createTool({
    name: "createOrUpdateFiles",
    description:
      "Create or update files in the sandbox and return an artifact path.",
    parameters: createOrUpdateFilesParamsSchema,
    // --- Reverting to original async handler ---
    handler: async params => {
      const currentSandboxId = sandboxId
      const toolStepName = "TOOL_createOrUpdateFiles"
      const filePaths = params.files.map(
        (f: { path: string; content: string }) => f.path
      )
      log.info(`${toolStepName}_START: Creating/updating files.`, {
        eventId,
        currentSandboxId,
        files: filePaths,
      })
      try {
        if (!currentSandboxId)
          throw new Error("Sandbox ID is null for createOrUpdateFiles tool")
        const sandbox = await getSandboxFunc(currentSandboxId)
        if (!sandbox)
          throw new Error(`Sandbox not found for ID: ${currentSandboxId}`)

        if (params.files.length === 0) {
          log.warn(
            `${toolStepName}_NO_FILES: No files were specified to write.`,
            { eventId, currentSandboxId }
          )
          return {
            message: "No files specified to write.",
            files: [],
          }
        }

        const writtenFilesData: Array<{ path: string; content: string }> = []
        log.info(`${toolStepName}_WRITE_START: Writing files to sandbox.`, {
          eventId,
          currentSandboxId,
          files: filePaths,
        })
        for (const file of params.files) {
          await sandbox.files.write(file.path, file.content)
          log.info(
            `${toolStepName}_READ_BACK_START: Reading file content back.`,
            { eventId, currentSandboxId, filePath: file.path }
          )
          try {
            const content = await sandbox.files.read(file.path)
            writtenFilesData.push({ path: file.path, content })
            log.info(
              `${toolStepName}_READ_BACK_SUCCESS: Successfully read file content back.`,
              {
                eventId,
                currentSandboxId,
                filePath: file.path,
                length: content.length,
              }
            )
          } catch (readError: unknown) {
            let errorMessage = "Unknown read error"
            let errorStack = undefined
            if (readError instanceof Error) {
              errorMessage = readError.message
              errorStack = readError.stack
            } else if (typeof readError === "string") {
              errorMessage = readError
            }

            log.error(
              `${toolStepName}_READ_BACK_ERROR: Failed to read file content back after writing.`,
              {
                eventId,
                currentSandboxId,
                filePath: file.path,
                error: errorMessage,
                stack: errorStack,
              }
            )
            throw new Error(
              `Failed to read back file ${file.path}: ${errorMessage}`
            )
          }
        }
        log.info(`${toolStepName}_WRITE_END: Files written and read back.`, {
          eventId,
          currentSandboxId,
          writtenFiles: writtenFilesData.map(f => f.path),
        })

        log.info(
          `${toolStepName}_SUCCESS: Tool finished successfully, returning file contents.`,
          {
            eventId,
            currentSandboxId,
            returnedFiles: writtenFilesData.map(f => f.path),
          }
        )
        return {
          message: `Files created/updated: ${writtenFilesData
            .map(f => f.path)
            .join(", ")}`,
          files: writtenFilesData,
        }
      } catch (e: unknown) {
        let errorMessage = "Unknown create/update error"
        let errorStack = undefined
        if (e instanceof Error) {
          errorMessage = e.message
          errorStack = e.stack
        } else if (typeof e === "string") {
          errorMessage = e
        }

        log.error(`${toolStepName}_ERROR: Error in createOrUpdateFiles tool.`, {
          eventId,
          currentSandboxId,
          error: errorMessage,
          stack: errorStack,
        })
        return {
          error: `Tool failed: ${errorMessage}`,
        }
      }
      // --- End reverting handler ---
    },
  })
}
