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
import { readAgentInstructions } from "@/utils/logic/readAgentInstructions"

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
  const baseDeps: Omit<AgentDependencies, "agents"> = {
    allTools,
    log: logger,
    apiKey: process.env.DEEPSEEK_API_KEY!,
    modelName: process.env.DEEPSEEK_MODEL || "deepseek-coder",
    systemEvents,
    sandbox: await getSandbox(sandboxId),
  }

  // 3. Load All Agent Instructions Concurrently
  const [
    coderInstructions,
    testerInstructions,
    teamLeadInstructions,
    criticInstructions,
    toolingInstructions,
  ] = await Promise.all([
    readAgentInstructions("Coder"),
    readAgentInstructions("Tester"),
    readAgentInstructions("TeamLead"),
    readAgentInstructions("Critic"),
    readAgentInstructions("Tooling"),
  ])
  logger.info(
    { step: HandlerStepName.CREATE_AGENTS_START },
    "Agent instructions loaded."
  )

  // 4. Create Agent Instances with Instructions
  const teamLeadDeps = { ...baseDeps, instructions: teamLeadInstructions }
  const testerDeps = { ...baseDeps, instructions: testerInstructions }
  const coderDeps = { ...baseDeps, instructions: coderInstructions }
  const criticDeps = { ...baseDeps, instructions: criticInstructions }
  const toolingDeps = { ...baseDeps, instructions: toolingInstructions }

  const teamLead = createTeamLeadAgent(teamLeadDeps)
  const tester = createTesterAgent(testerDeps)
  const coder = createCodingAgent(coderDeps)
  const critic = createCriticAgent(criticDeps)
  const tooling = createToolingAgent(toolingDeps)

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
  return fullAgentDeps
}
