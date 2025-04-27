import { z } from "zod"
import { createTool } from "@inngest/agent-kit"
import { NetworkStatus, TddNetworkState } from "@/types/network"
import type { AnyTool, HandlerLogger } from "@/types/agents"

// Define the schema for the parameters
export const updateTaskStateParamsSchema = z.object({
  newStatus: NetworkStatus.describe(
    "The new status to set for the network task."
  ),
  // Add optional fields that might be updated by different agents
  test_requirements: z
    .string()
    .optional()
    .describe("Generated test requirements."),
  test_code: z.string().optional().describe("Generated test code."),
  implementation_code: z
    .string()
    .optional()
    .describe("Generated implementation code."),
  critique: z
    .string()
    .optional()
    .describe("Critique provided by the Critic agent."),
  first_failing_test: z
    .string()
    .optional()
    .describe("Information about the first failing test."),
  last_command_output: z
    .string()
    .optional()
    .describe("Output of the last executed command."),
})

type UpdateTaskStateParams = z.infer<typeof updateTaskStateParamsSchema>

/**
 * Creates a tool for updating the TDD network state in the KV store.
 */
export function createUpdateTaskStateTool(
  log: HandlerLogger,
  eventId: string
): AnyTool {
  return createTool({
    name: "updateTaskState",
    description:
      "Updates the current state of the TDD network task in the shared KV store. MUST be called by an agent after completing its primary action.",
    parameters: updateTaskStateParamsSchema,
    handler: async (params: UpdateTaskStateParams, { network }) => {
      if (!network?.state?.kv) {
        const errorMsg =
          "Network state KV store is not available in updateTaskState tool."
        const logError = log ? log.error : console.error
        logError({ step: "TOOL_UPDATE_STATE_ERROR" }, errorMsg, { eventId })
        throw new Error(errorMsg)
      }

      const currentSandboxId =
        network.state.kv.get("network_state")?.sandboxId || null
      log.info(
        { step: "TOOL_UPDATE_STATE_START" },
        `Attempting to update network state. New status: ${params.newStatus}`,
        { eventId, sandboxId: currentSandboxId, params }
      )

      // Get the current state
      let currentState = network.state.kv.get("network_state") as
        | TddNetworkState
        | undefined

      if (!currentState) {
        // This ideally shouldn't happen if the network is running, but handle defensively
        currentState = {
          task: "unknown - state lost before update",
          status: NetworkStatus.Enum.FAILED, // Mark as failed if state was lost
          sandboxId: currentSandboxId || undefined,
        }
        log.warn(
          { step: "TOOL_UPDATE_STATE_WARN" },
          "Current state was missing, initializing default before update.",
          { eventId, sandboxId: currentSandboxId }
        )
      }

      // Update the state with new values
      currentState.status = params.newStatus
      if (params.test_requirements !== undefined)
        currentState.test_requirements = params.test_requirements
      if (params.test_code !== undefined)
        currentState.test_code = params.test_code
      if (params.implementation_code !== undefined)
        currentState.implementation_code = params.implementation_code
      if (params.critique !== undefined)
        currentState.implementation_critique = params.critique
      if (params.first_failing_test !== undefined)
        currentState.first_failing_test = params.first_failing_test
      if (params.last_command_output !== undefined)
        currentState.last_command_output = params.last_command_output

      // Clear fields that are likely consumed or invalidated by the status change
      // Example: If moving to NEEDS_TEST_CRITIQUE, clear requirements
      // TODO: Refine this clearing logic based on specific state transitions.
      if (params.newStatus === NetworkStatus.Enum.NEEDS_TEST_CRITIQUE) {
        currentState.test_requirements = undefined // Requirements consumed
      }
      // Add more clearing logic as needed

      // Save the updated state back to KV
      network.state.kv.set("network_state", currentState)

      const logData = { ...currentState } // Create a copy for logging
      // Avoid logging potentially large code strings
      if (logData.test_code) logData.test_code = "[omitted]"
      if (logData.implementation_code) logData.implementation_code = "[omitted]"

      log.info(
        { step: "TOOL_UPDATE_STATE_SUCCESS" },
        `Network state updated successfully. New status: ${currentState.status}`,
        {
          eventId,
          sandboxId: currentState.sandboxId,
          finalState: JSON.stringify(logData),
        }
      )

      return `State updated successfully to ${currentState.status}.`
    },
  })
}
