import { z } from "zod"
// Using Tool<any> and opts: any as a temporary workaround for type issues
import { type Tool, createTool } from "@inngest/agent-kit"
import { NetworkStatus, type TddNetworkState } from "@/types/network"
import type { HandlerLogger } from "@/types/agents"

// Revert schema to use newStatus and NetworkStatus directly
export const updateTaskStateParamsSchema = z.object({
  newStatus: NetworkStatus.describe(
    "The new status to set for the network task."
  ),
  // Re-add other fields if they were part of the intended design
  critique: z
    .string()
    .optional()
    .describe("Critique provided by the Critic agent."),
  test_requirements: z
    .string()
    .optional()
    .describe("Generated test requirements."),
  // ... potentially add back other fields like test_requirements, code, etc. if needed
  // For now, keep it simple with just status and critique
})

type UpdateTaskStateParams = z.infer<typeof updateTaskStateParamsSchema>

/**
 * Creates a tool for updating the TDD network state.
 * !!! TEMPORARY WORKAROUND: Using Tool<any> and opts: any due to typing issues !!!
 */
export function createUpdateTaskStateTool(
  log: HandlerLogger,
  eventId: string
  // Using Tool<any> temporarily
): Tool<any> {
  return createTool({
    name: "update_task_state",
    description:
      "Updates the current state of the TDD network task in the shared KV store.",
    parameters: updateTaskStateParamsSchema,
    // Using opts: any temporarily
    handler: async (params: UpdateTaskStateParams, opts: any) => {
      const kv = opts?.network?.state?.kv // Optional chaining for safety

      if (!kv) {
        const errorMsg =
          "Network state KV store is not available in updateTaskState tool."
        const logError = log ? log.error : console.error
        logError({ step: "TOOL_UPDATE_STATE_ERROR" }, errorMsg, { eventId })
        throw new Error(errorMsg)
      }

      const currentState = kv.get("network_state") as
        | TddNetworkState
        | undefined

      log.info(
        { step: "TOOL_UPDATE_STATE_START" },
        `Attempting to update network state. New status: ${params.newStatus}`,
        {
          eventId,
          currentState: currentState ? JSON.stringify(currentState) : "null",
          params,
        }
      )

      let baseState: Partial<TddNetworkState>
      if (!currentState) {
        log.warn(
          { step: "TOOL_UPDATE_STATE_WARN" },
          "Initial state was missing in KV store when trying to update.",
          { eventId, updateData: params }
        )
        baseState = {
          task: "unknown - state missing before update",
          status: "FAILED",
          sandboxId: undefined,
        }
      } else {
        baseState = currentState
      }

      const updatedState: TddNetworkState = {
        ...(baseState as TddNetworkState),
        status: params.newStatus,
        ...(params.critique !== undefined && {
          implementation_critique: params.critique,
        }),
        ...(params.test_requirements !== undefined && {
          test_requirements: params.test_requirements,
        }),
      }

      if (params.newStatus === "NEEDS_TEST_CRITIQUE") {
        updatedState.test_requirements = undefined
      }

      kv.set("network_state", updatedState)

      const logData = { ...updatedState }
      if (logData.test_code) logData.test_code = "[omitted]"
      if (logData.implementation_code) logData.implementation_code = "[omitted]"

      log.info(
        { step: "TOOL_UPDATE_STATE_SUCCESS" },
        `Network state updated successfully. New status: ${updatedState.status}`,
        {
          eventId,
          finalState: JSON.stringify(logData),
        }
      )

      return `State updated successfully to ${updatedState.status}.`
    },
  })
}

// Example of how the tool might be used by an agent (conceptual)
/*
async function teamLeadCompletesRequirements(networkContext) {
  const requirements = "Generated requirements..."
  // ... other logic ...

  // Call the tool to update state
  await networkContext.useTool("update_task_state", {
    status: NetworkStatus.Enum.NEEDS_REQUIREMENTS_CRITIQUE, // Use string literal now
    requirements: requirements // Assuming the schema is updated to include this
  })
}
*/
