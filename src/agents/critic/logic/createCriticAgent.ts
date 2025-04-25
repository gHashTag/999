import { createAgent } from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import type { AgentDependencies, AnyTool } from "../../../types/agents.js"
import { NetworkStatus, TddNetworkState } from "../../../types/network.js"

export function createCriticAgent({
  allTools,
  apiKey,
  modelName,
}: AgentDependencies) {
  return createAgent({
    name: "Critic Agent",
    description:
      "Reviews code and/or tests for correctness and style, providing clear feedback.",
    system: async ({ network }: any) => {
      // System prompt needs network access
      const state: Partial<TddNetworkState> =
        network?.get("network_state") || {}
      const status = state.status
      let basePrompt = `You are a code reviewer agent. Your task is to review provided code and/or tests based on the original task description: "${state.task || "Unknown task"}".`
      let contentToReview = ""

      if (status === NetworkStatus.Enum.NEEDS_TEST_CRITIQUE) {
        basePrompt += `\nReview the following unit tests ('test.js'):`
        contentToReview =
          state.test_code || "Error: Test code not found in state."
      } else if (status === NetworkStatus.Enum.NEEDS_CODE_CRITIQUE) {
        basePrompt += `\nReview the following implementation code ('implementation.js') against the provided tests ('test.js'):`
        const implCode =
          state.implementation_code ||
          "Error: Implementation code not found in state."
        const testCode =
          state.test_code || "Error: Test code not found in state."
        contentToReview = `\n\n**Implementation (implementation.js):**\n\`\`\`javascript\n${implCode}\n\`\`\`\n\n**Tests (test.js):**\n\`\`\`javascript\n${testCode}\n\`\`\`\n`
      } else {
        basePrompt += `\nERROR: Critic agent called in unexpected state: ${status}. Cannot determine what to review.`
      }

      const finalPrompt = `${basePrompt}\n\n${contentToReview}\n\n**Review Output Format:** Provide clear feedback. \n- If everything is good, state **'Tests OK'** or **'Code OK'** or **'Approved'** or **'LGTM'**. Use clear approval terms.\n- If revisions are needed, clearly state **'Revision needed'** and explain the issues/errors/problems found.\n- **If you are unsure about the correctness or the review result is ambiguous, use the 'askHumanForInput' tool to request clarification before approving or requesting revision.**\nYour response will determine the next step in the workflow.`
      return finalPrompt
    },
    model: deepseek({
      apiKey: apiKey,
      model: modelName,
    }),
    // Filter out tools not needed by critic if necessary (example: processArtifact)
    tools: allTools.filter(
      (tool: AnyTool) =>
        tool.name !== "createOrUpdateFiles" && tool.name !== "terminal"
    ),
    // Removed lifecycle and onFinish hook - critique extraction will happen elsewhere if needed
  })
}
