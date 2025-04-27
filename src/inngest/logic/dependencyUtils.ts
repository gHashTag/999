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
import { Agent } from "@inngest/agent-kit"

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

  const allTools = getAllTools(logger, getSandbox, sandboxId, eventId)
  logger.info({ step: HandlerStepName.CREATE_TOOLS_END }, "Tools created.", {
    sandboxId,
    eventId,
    toolCount: allTools.length,
  })

  // Create base dependencies object
  const baseDeps: Omit<AgentDependencies, "agents"> = {
    allTools,
    log: logger,
    apiKey: process.env.DEEPSEEK_API_KEY!,
    modelName: process.env.DEEPSEEK_MODEL || "deepseek-coder",
    systemEvents,
    sandbox: await getSandbox(sandboxId),
  }

  // Create individual agents without explicit casting initially
  // Let TypeScript infer the type from create*Agent functions
  // Note: create*Agent functions return Agent<any> currently
  const teamLead = createTeamLeadAgent(baseDeps) // Returns Agent<any>
  const tester = createTesterAgent(baseDeps) // Returns Agent<any>
  const coder = createCodingAgent(baseDeps) // Returns Agent<any>
  const critic = createCriticAgent(baseDeps) // Returns Agent<any>
  const tooling = createToolingAgent(baseDeps) // Returns Agent<any>

  // Construct the agents object conforming to the Agents interface
  // The Agents interface expects Agent<TddNetworkState>
  // We might need to adjust the Agents interface or the create*Agent functions
  // For now, keep the structure but be aware of the type mismatch
  const agents: Agents = {
    teamLead: teamLead as unknown as Agent<TddNetworkState>,
    tester: tester as unknown as Agent<TddNetworkState>,
    coder: coder as unknown as Agent<TddNetworkState>,
    critic: critic as unknown as Agent<TddNetworkState>,
    tooling: tooling as unknown as Agent<TddNetworkState>,
  }

  // Combine base dependencies and agents
  const fullAgentDeps: AgentDependencies = {
    ...baseDeps,
    agents,
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
  return fullAgentDeps // Return the object containing both tools and agents
}
