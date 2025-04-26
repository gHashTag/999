/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import {
  createAgent,
  type AgentResult,
  type NetworkRun,
} from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import type { AgentDependencies } from "@/types/agents"
import { NetworkStatus, type TddNetworkState } from "@/types/network"
import { log } from "@/utils/logic/logger"

// Helper type for critique result
type CritiqueResult = {
  critique?: string // Optional critique text
  approved: boolean // Whether the code/test is approved
}

export function createCriticAgent({
  allTools,
  apiKey,
  modelName,
}: AgentDependencies) {
  // Get only the necessary tool for this agent
  const askHumanTool = allTools.find(tool => tool.name === "askHumanForInput")
  if (!askHumanTool) {
    throw new Error(
      "Required tool 'askHumanForInput' not found in provided tools."
    )
  }

  return createAgent({
    name: "Critic Agent",
    description: "Reviews code or tests and provides critique or approval.",
    // Updated system prompt to focus on critique and approval, not file access
    system: `You are a senior software engineer acting as a code/test reviewer.\\nYour task is to review the provided code or tests based on the original task description and determine if it meets the requirements and quality standards.\\n\\nInput state will contain either \`state.test_code\` (for reviewing tests) or \`state.implementation_code\` (for reviewing implementation). It might also contain the original \`state.task\`.\\n\\n**Workflow:**\\n1. **Identify Input:** Determine if you are reviewing tests (status was NEEDS_TEST_CRITIQUE) or implementation (status was NEEDS_CODE_CRITIQUE).\\n2. **Review:** Analyze the provided code/tests (conceptually, based on state or previous agent output) against the task description.\\n3. **Decide:** Based on your review, decide if the code/tests are approved.\\n4. **Formulate Response:** Structure your response as a JSON object with two keys:\\n   - \`approved\`: boolean (true if approved, false otherwise)\\n   - \`critique\`: string (detailed feedback if not approved, or a short confirmation like \\\"LGTM!\\\" if approved).\\n\\n**CRITICAL INSTRUCTION:** Your *entire* response MUST be a valid JSON object matching the format: \`{ \\\"approved\\\": boolean, \\\"critique\\\": string }\`. Do NOT add explanations outside the JSON.\\n\n**Example Approved Response:**\\n\`{ \\\"approved\\\": true, \\\"critique\\\": \\\"Looks good to me. Tests cover the main cases.\\\" }\`\\n\n**Example Needs Revision Response:**\\n\`{ \\\"approved\\\": false, \\\"critique\\\": \\\"The tests are missing edge cases for zero and negative inputs. Please add these.\\\" }\`\\n\n**If the input code/tests or task description is unclear, use the \'askHumanForInput\' tool to ask for clarification *instead* of providing a review.**\\nDo NOT attempt to modify files or run commands. Your sole output is the JSON review object.`,
    model: deepseek({
      apiKey: apiKey,
      model: modelName,
    }),
    // Pass only the askHuman tool
    tools: [askHumanTool],
    // Updated lifecycle hook
    lifecycle: {
      onResponse: async (opts: {
        result: AgentResult
        network?: NetworkRun<TddNetworkState>
      }): Promise<AgentResult> => {
        const { result, network } = opts

        if (!network?.state?.kv) {
          log("warn", "CRITIC_LIFECYCLE", "Network state KV not found.")
          result.output = [
            {
              type: "text",
              role: "assistant",
              content: "Error: Network state KV not found.",
            },
          ]
          return result
        }

        const state = network.state.kv.get("network_state")
        if (!state) {
          log("warn", "CRITIC_LIFECYCLE", "State not found in KV.")
          result.output = [
            {
              type: "text",
              role: "assistant",
              content: "Error: State not found in KV.",
            },
          ]
          return result
        }

        let critiqueResult: CritiqueResult

        try {
          let llmOutputString: string | undefined
          if (Array.isArray(result.output) && result.output.length > 0) {
            const firstMessage = result.output[0]
            if (
              firstMessage.type === "text" &&
              typeof firstMessage.content === "string"
            ) {
              llmOutputString = firstMessage.content
            }
          }

          if (typeof llmOutputString !== "string") {
            throw new Error(
              `Could not extract string content from LLM output: ${JSON.stringify(result.output)}`
            )
          }
          critiqueResult = JSON.parse(llmOutputString)
          if (
            typeof critiqueResult !== "object" ||
            critiqueResult === null ||
            typeof critiqueResult.approved !== "boolean" ||
            typeof critiqueResult.critique !== "string"
          ) {
            throw new Error("Invalid JSON structure")
          }
        } catch (error: any) {
          console.error(
            `[CriticAgent Lifecycle] Failed to parse critique JSON. Result Output: ${JSON.stringify(result.output)}`,
            { error: error.message }
          )
          critiqueResult = {
            approved: false,
            critique: `Error: Could not process the review response. Original LLM output: ${JSON.stringify(result.output)}`,
          }
        }

        const currentStatus = state.status
        let nextStatus: NetworkStatus
        let critiqueField: keyof TddNetworkState | null = null

        if (currentStatus === NetworkStatus.Enum.NEEDS_TEST_CRITIQUE) {
          critiqueField = "test_critique"
          nextStatus = critiqueResult.approved
            ? NetworkStatus.Enum.NEEDS_COMMAND_EXECUTION
            : NetworkStatus.Enum.NEEDS_TEST_REVISION
        } else if (
          currentStatus === NetworkStatus.Enum.NEEDS_IMPLEMENTATION_CRITIQUE
        ) {
          critiqueField = "implementation_critique"
          nextStatus = critiqueResult.approved
            ? NetworkStatus.Enum.COMPLETED
            : NetworkStatus.Enum.NEEDS_IMPLEMENTATION_REVISION
        } else {
          console.warn(
            `[CriticAgent Lifecycle] Unexpected status ${currentStatus}. Defaulting to NEEDS_TEST.`
          )
          nextStatus = NetworkStatus.Enum.NEEDS_TEST
        }

        state.status = nextStatus
        if (critiqueField && critiqueField in state) {
          state[critiqueField] = critiqueResult.critique
        }
        state.generated_command = undefined

        network.state.kv.set("network_state", state)
        log(
          "info",
          "CRITIC_LIFECYCLE",
          `Review complete. Approved: ${critiqueResult.approved}. State updated to ${nextStatus}. Critique: ${critiqueResult.critique}`
        )

        // Return the original result object to satisfy the expected type
        return result
      },
    },
  })
}
