/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createAgent,
  type AgentResult,
  type NetworkRun,
} from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
import type { AgentDependencies } from "@/types/agents"
import { NetworkStatus } from "@/types/network"
import { log } from "@/utils/logic/logger" // Import log directly
import type { TddNetworkState } from "@/types/network"

export function createTesterAgent({
  allTools,
  apiKey,
  modelName,
}: AgentDependencies) {
  // Get only the necessary tool for this agent
  const askHumanTool = allTools.find(tool => tool.name === "askHumanForInput")
  if (!askHumanTool) {
    // Handle error: required tool is missing
    throw new Error(
      "Required tool 'askHumanForInput' not found in provided tools."
    )
  }

  return createAgent({
    name: "Tester Agent",
    description: "Generates an `open-codex` command to write unit tests.",
    system: `You are a QA engineer agent acting as a command generator.
                 Your task is to generate a SINGLE, executable \`open-codex\` command to instruct a local AI assistant (\`open-codex\`) to write simple unit tests for a given function description.

                 **CRITICAL INSTRUCTION:** Your *entire* response MUST be ONLY the \`open-codex\` command string, nothing else. Do NOT add explanations or introductions.
                 **CRITICAL INSTRUCTION:** The generated command MUST include the necessary prompt for \`open-codex\` to create the tests and save them to a specific file (e.g., './math.test.js').
                 **CRITICAL INSTRUCTION:** Include the \`--execute\` flag (or the appropriate flag for immediate execution if different) in the generated command to ensure \`open-codex\` attempts to run.

                 **Example Input Task:** "Create a function that adds two numbers"
                 **Example Output (Your Response):** open-codex "Create a file named math.test.js with simple unit tests for adding two numbers using Node assert, requiring the function from ./math.js" --execute

                 **If critique on previous tests is provided (state.test_critique), incorporate it into the prompt for \`open-codex\` in the generated command.**
                 (Example incorporating critique: open-codex "Revise the file math.test.js based on this critique: [critique text]. Ensure tests cover edge cases like zero and negative numbers." --execute)

                 **If the task description or critique is unclear, use the 'askHumanForInput' tool to ask for clarification *instead* of generating a command.**
                 Do NOT attempt to write the test code yourself. Your SOLE output is the command string.`, // System prompt needs access to state eventually
    model: deepseek({
      apiKey: apiKey,
      model: modelName,
    }),
    // Pass only the askHuman tool
    tools: [askHumanTool],
    lifecycle: {
      // Modified: Set status for Critic, assuming command generation is the main task.
      onResponse: async (opts: {
        result: AgentResult // Use AgentResult type
        network?: NetworkRun<any> // Corrected: NetworkRun takes only one type argument
      }): Promise<AgentResult> => {
        // Ensure return type is AgentResult
        const { result, network } = opts
        // const eventId = network?.eventId ?? "unknown" // eventId is not directly on network
        // TODO: Find correct way to access eventId if needed for logging

        if (network?.state?.kv) {
          const state = network.state.kv.get("network_state") as TddNetworkState

          if (state) {
            log(
              "info",
              "TESTER_STATE_RETRIEVED",
              "Retrieved state from KV in TesterAgent",
              {
                status: state.status,
                generatedCommand: state.generated_command,
              }
            )
          } else {
            log(
              "warn",
              "TESTER_STATE_NOT_FOUND",
              "Network state KV not found in TesterAgent.",
              {
                /* eventId removed */
              }
            )
            result.output = [
              {
                type: "text",
                role: "assistant",
                content: "Error: State not found.",
              },
            ]
            return result
          }

          // Extract command string from result.output[0].content directly
          let commandString = ""
          if (
            Array.isArray(result.output) &&
            result.output.length > 0 &&
            result.output[0].type === "text" &&
            typeof result.output[0].content === "string"
          ) {
            commandString = result.output[0].content.trim()
          }

          // Corrected error handling block
          if (!commandString) {
            log(
              "warn",
              "TESTER_NO_COMMAND",
              "Could not extract command string from LLM response.",
              { /* eventId removed */ output: result.output }
            )
            state.status = NetworkStatus.Enum.FAILED
            state.generated_command = undefined
            network.state.kv.set("network_state", state)
            // Modify result to indicate failure and return it
            result.output = [
              {
                type: "text",
                role: "assistant",
                content: "Error: Could not extract command.",
              },
            ]
            return result // Ensure result is returned here
          }

          state.generated_command = commandString // Store the extracted command
          state.status = NetworkStatus.Enum.NEEDS_TEST_CRITIQUE
          state.test_critique = undefined // Clear previous critique
          network.state.kv.set("network_state", state)
          log(
            "info",
            "TESTER_LIFECYCLE",
            `Generated command for open-codex. State updated to ${state.status}.`,
            {
              /* eventId removed */ status: state.status,
              generatedCommand: commandString,
            }
          )
        } else {
          log("warn", "TESTER_LIFECYCLE", `Network state KV not found.`, {
            /* eventId removed */
          })
        }
        return result // Return the original result object
      },
    },
  })
}
