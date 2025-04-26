import { z } from "zod"
import { createTool } from "@inngest/agent-kit"
import type { LoggerFunc } from "@/types/agents"
// import type { GetSandboxFunc } from "@/inngest"; // Not needed for this tool

// Схема может быть определена здесь или импортирована
export const askHumanForInputParamsSchema = z.object({
  question: z.string().describe("The specific question to ask the human."),
  context: z
    .string()
    .optional()
    .describe("Optional additional context for the human."),
})

export function createAskHumanForInputTool(
  log: LoggerFunc,
  eventId: string // sandboxId and getSandbox might not be needed here
) {
  return createTool({
    name: "askHumanForInput",
    description:
      "Asks the human user for input when the agent is stuck or needs clarification. Provides context.",
    parameters: askHumanForInputParamsSchema, // Используем схему
    handler: async params => {
      const toolStepName = "TOOL_askHumanForInput"
      log("warn", `${toolStepName}_INVOKED`, "Agent requires human input.", {
        eventId,
        question: params.question,
        context: params.context,
      })

      // This tool doesn't actually *ask* in this implementation.
      // It signals that human input is needed by returning specific output.
      // The calling layer (e.g., the router or main handler) should interpret this.
      const humanResponse = "<HUMAN_INPUT_REQUIRED>"

      // Simulate getting a response (in a real scenario, this would involve external interaction)
      log(
        "info",
        `${toolStepName}_RESPONSE_SIMULATED`,
        "Simulating response.",
        {
          eventId,
          humanResponse,
        }
      )

      return {
        response: humanResponse,
        message:
          "Human input requested. Waiting for external response. The actual response is simulated here.",
      }
    },
  })
}
