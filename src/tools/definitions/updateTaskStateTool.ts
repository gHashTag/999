import { z } from "zod"
import { createTool } from "@inngest/agent-kit"
import type { HandlerLogger, KvStore } from "@/types/agents"
import { updateTaskStateParamsSchema } from "@/tools/schemas"

// Infer the parameters type from the Zod schema
type UpdateTaskStateParams = z.infer<typeof updateTaskStateParamsSchema>

export function createUpdateTaskStateTool(
  log: HandlerLogger,
  kv: KvStore | undefined,
  eventId: string
) {
  return createTool({
    name: "updateTaskState",
    description:
      "Updates the current state in the Key-Value store. Only updates provided fields.",
    parameters: updateTaskStateParamsSchema,
    handler: async (params: UpdateTaskStateParams) => {
      log.info(`Attempting to update network state.`, {
        step: "TOOL_UPDATE_STATE_START",
        eventId,
        updates: params.updates,
      })

      if (!kv) {
        const errorMsg = "KV store not available"
        log.error(errorMsg, { step: "TOOL_UPDATE_STATE_ERROR", eventId })
        return { success: false, error: errorMsg }
      }

      try {
        for (const [key, value] of Object.entries(params.updates)) {
          if (value !== undefined) {
            await kv.set(key, value)
          }
        }

        log.info("Network state updated successfully.", {
          step: "TOOL_UPDATE_STATE_SUCCESS",
          eventId,
          updatedKeys: Object.keys(params.updates),
        })
        return { success: true }
      } catch (error: unknown) {
        const errorMsg = `KV set failed: ${
          error instanceof Error ? error.message : String(error)
        }`
        log.error(errorMsg, {
          step: "TOOL_UPDATE_STATE_ERROR",
          eventId,
          error: error instanceof Error ? error.message : String(error),
        })
        return { success: false, error: errorMsg }
      }
    },
  })
}
