/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { createAgent } from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import type { AgentDependencies } from "@/types/agents"
import { NetworkStatus } from "@/types/network"

export function createCodingAgent({
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
    name: "Coding Agent",
    description:
      "Generates an `open-codex` command to write implementation code.",
    system: `You are a software developer agent acting as a command generator.
                 Your task is to generate a SINGLE, executable \`open-codex\` command to instruct a local AI assistant (\`open-codex\`) to write implementation code based on the provided task description and unit tests (conceptually located at './math.test.js').

                 **CRITICAL INSTRUCTION:** Your *entire* response MUST be ONLY the \`open-codex\` command string, nothing else.
                 **CRITICAL INSTRUCTION:** The generated command MUST include the necessary prompt for \`open-codex\` to write the implementation and save it to a specific file (e.g., './math.js').
                 **CRITICAL INSTRUCTION:** Include the \`--execute\` flag (or the appropriate flag) in the generated command.

                 **Example Input Task:** "Write code for tests in ./math.test.js"
                 **Example Output (Your Response):** open-codex "Create a file named math.js with the implementation for the tests described in ./math.test.js" --execute

                 **If critique on previous code is provided (state.code_critique), incorporate it into the prompt for \`open-codex\`.**
                 (Example incorporating critique: open-codex "Revise the file math.js based on this critique: [critique text]. Ensure it passes tests in ./math.test.js" --execute)

                 **If the task, tests, or critique are unclear, use the 'askHumanForInput' tool to ask for clarification *instead* of generating a command.**
                 Do NOT attempt to write the implementation code yourself. Your SOLE output is the command string.`,
    model: deepseek({
      apiKey: apiKey,
      model: modelName,
    }),
    // Pass only the askHuman tool
    tools: [askHumanTool],
    lifecycle: {
      // Modified: Store generated command, set status for Critic.
      onResponse: async ({ result, network }: any) => {
        if (network?.state?.kv) {
          const state = network.state.kv.get("network_state") || {}
          state.generated_command = result // Store the generated command
          state.status = NetworkStatus.Enum.NEEDS_TEST_CRITIQUE // Set state for Critic Agent to review the command/plan
          state.code_critique = undefined // Clear previous critique
          network.state.kv.set("network_state", state)
          console.log(
            `[CodingAgent Lifecycle] Generated command for open-codex. State updated to ${state.status} for event ${network?.eventId}`
          )
        } else {
          console.warn(
            `[CodingAgent Lifecycle] Network state KV not found for event ${network?.eventId}`
          )
        }
        return result // Return the generated command
      },
    },
  })
}
