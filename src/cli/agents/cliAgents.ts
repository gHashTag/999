import { createCodingAgent } from "../../agents/coder/logic/createCodingAgent" // Adjusted path
import { createTesterAgent } from "../../agents/tester/logic/createTesterAgent" // Adjusted path
import { AgentDependencies } from "../../types/agents" // Adjusted path

// Define the structure for the CLI agents object
export interface CliAgents {
  coder: {
    ask: (q: string) => Promise<string>
  }
  tester: {
    ask: (q: string) => Promise<string>
  }
}

/**
 * Creates agent instances specifically for the CLI PoC context.
 * @param deps - The agent dependencies (likely mocks).
 * @returns An object containing the initialized CLI agents.
 */
export function createCliAgents(deps: AgentDependencies): CliAgents {
  const agents: CliAgents = {
    coder: {
      ask: async (q: string) => {
        // FIX: Remove second argument
        const agentInstance = createCodingAgent(deps)
        const result = await agentInstance.run(q)
        // Add checks for result and result.output before joining
        if (!result || !Array.isArray(result.output)) {
          console.error("Invalid response structure from Coder agent:", result)
          return "Error: Invalid response from Coder agent"
        }
        return result.output.join("\n")
      },
    },
    tester: {
      ask: async (q: string) => {
        // FIX: Remove second argument
        const agentInstance = createTesterAgent(deps)
        const result = await agentInstance.run(q)
        // Add checks for result and result.output before joining
        if (!result || !Array.isArray(result.output)) {
          console.error("Invalid response structure from Tester agent:", result)
          return "Error: Invalid response from Tester agent"
        }
        return result.output.join("\n")
      },
    },
  }
  return agents
}
