import {
  createTeamLeadAgent,
  createTesterAgent,
  createCodingAgent,
  createCriticAgent,
  createToolingAgent,
} from "@/agents"
import { type AgentDependencies, type Agents } from "@/types/agents"
import { getAllTools } from "@/tools/toolDefinitions"
import { getSandbox } from "@/inngest/utils/sandboxUtils"
import { systemEvents } from "@/utils/logic/systemEvents"
import type { HandlerLogger } from "@/types/agents"
import { HandlerStepName } from "@/types/handlerSteps"
import { TddNetworkState } from "@/types/network"
import { Agent /*, type Tool*/ } from "@inngest/agent-kit"
import { deepseek } from "@inngest/ai/models"
// readFileSync, // Removed unused import
// readAgentInstructions, // Removed unused import
// deepseek, // Removed unused import
;("@/inngest/utils/sandboxUtils")

/**
 * Creates all agent dependencies, including loading instructions
 * and creating agent instances.
 */
export async function createAgentDependencies(
  logger: HandlerLogger,
  sandboxId: string,
  eventId: string
): Promise<AgentDependencies> {
  logger.info(
    { step: HandlerStepName.CREATE_AGENTS_START },
    "Creating agent dependencies...",
    {
      sandboxId,
      eventId,
    }
  )

  // 1. Create Tools
  const allTools = getAllTools(logger, getSandbox, sandboxId, eventId)
  logger.info({ step: HandlerStepName.CREATE_TOOLS_END }, "Tools created.", {
    sandboxId,
    eventId,
    toolCount: allTools.length,
  })

  // 2. Create Base Dependencies
  const apiKey = process.env.DEEPSEEK_API_KEY
  const modelName = process.env.DEEPSEEK_MODEL || "deepseek-coder"
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY environment variable is not set.")
  }

  const model = deepseek({ apiKey, model: modelName })

  const sandbox = await getSandbox(sandboxId)

  const baseDeps: Omit<AgentDependencies, "agents"> = {
    allTools,
    log: logger,
    apiKey,
    modelName,
    model,
    systemEvents,
    sandbox,
    eventId,
  }

  // 3. Load All Agent Instructions Concurrently - REMOVED
  // const [
  //   coderInstructions,
  //   testerInstructions,
  //   teamLeadInstructions,
  //   criticInstructions,
  //   toolingInstructions,
  // ] = await Promise.all([
  //   readAgentInstructions("Coder"),
  //   readAgentInstructions("Tester"),
  //   readAgentInstructions("TeamLead"),
  //   readAgentInstructions("Critic"),
  //   readAgentInstructions("Tooling"),
  // ])
  // logger.info(
  //   { step: HandlerStepName.CREATE_AGENTS_START },
  //   "Agent instructions loaded."
  // )
  // Use placeholder instructions directly
  const coderInstructions = "Placeholder Coder Instructions"
  const testerInstructions = "Placeholder Tester Instructions"
  const teamLeadInstructions = "Placeholder TeamLead Instructions"
  const criticInstructions = "Placeholder Critic Instructions"
  const toolingInstructions = "Placeholder Tooling Instructions"

  // 4. Create Agent Instances with Instructions
  const teamLead = createTeamLeadAgent(baseDeps, teamLeadInstructions)
  const tester = createTesterAgent(baseDeps, testerInstructions)
  const coder = createCodingAgent(baseDeps, coderInstructions)
  const critic = createCriticAgent(baseDeps, criticInstructions)
  const tooling = createToolingAgent({
    ...baseDeps,
    instructions: toolingInstructions,
  })

  // 5. Construct Final Agents Object (with temporary cast)
  const agents: Agents = {
    teamLead: teamLead as unknown as Agent<TddNetworkState>,
    tester: tester as unknown as Agent<TddNetworkState>,
    coder: coder as unknown as Agent<TddNetworkState>,
    critic: critic as unknown as Agent<TddNetworkState>,
    tooling: tooling as unknown as Agent<TddNetworkState>,
  }

  // 6. Combine Base Dependencies and Agents
  const fullAgentDeps: AgentDependencies = {
    ...baseDeps,
    agents: agents as unknown as Record<string, Agent<any>>,
  }

  logger.info(
    { step: HandlerStepName.CREATE_AGENTS_END },
    "Agent dependencies created.",
    {
      sandboxId,
      eventId,
      agentNames: Object.keys(agents),
    }
  )
  return fullAgentDeps
}
