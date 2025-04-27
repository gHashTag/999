import { createCodingAgent } from "@/agents/coder/logic/createCodingAgent"
import { createCriticAgent } from "@/agents/critic/logic/createCriticAgent"
import { createTesterAgent } from "@/agents/tester/logic/createTesterAgent"
import { createTeamLeadAgent } from "@/agents/teamlead/logic/createTeamLeadAgent" // Correct casing
import { createToolingAgent } from "@/agents/tooling/logic/createToolingAgent"
import { getAllTools } from "@/tools/toolDefinitions"
import { type AgentDependencies, type HandlerLogger } from "@/types/agents" // Import HandlerLogger
import { log as appLog } from "@/utils/logic/logger"
import { systemEvents } from "@/utils/logic/systemEvents"
import { readAgentInstructions } from "@/utils/logic/readAgentInstructions"
import { getSandbox } from "@/inngest/utils/sandboxUtils"
import { Agent } from "@inngest/agent-kit"

// Define the structure for the CLI agents object
export interface CliAgents {
  coder: Agent<TddNetworkState>
  tester: Agent<TddNetworkState>
  critic: Agent<TddNetworkState>
  teamLead: Agent<TddNetworkState>
  tooling: Agent<TddNetworkState>
}

/**
 * Creates agent instances specifically for the CLI PoC context.
 * NOTE: This function is now async due to instruction loading.
 * @returns An object containing the initialized CLI agents.
 */
export async function createCliAgents(): Promise<CliAgents> {
  const log: HandlerLogger = appLog as any // Assign appLog to HandlerLogger compatible variable
  log.info("CLI_AGENTS_INIT", "Initializing CLI agents...")
  const apiKey = process.env.DEEPSEEK_API_KEY || ""
  const modelName = process.env.DEEPSEEK_MODEL || "deepseek-coder"

  if (!apiKey) {
    log.warn("CLI_AGENTS_WARN", "DEEPSEEK_API_KEY not found in environment.")
  }

  // Pass empty string to getSandbox as it expects a string
  const sandbox = await getSandbox("") // Changed undefined to ""
  const eventId = "cli-event-id"
  // Pass the correctly typed log, and check sandbox before accessing id
  const allTools = getAllTools(
    log,
    getSandbox,
    eventId,
    sandbox?.sandboxId ?? null
  )

  log.info("CLI_AGENTS_INSTR", "Loading agent instructions...")
  const [
    coderInstructions,
    testerInstructions,
    criticInstructions,
    teamLeadInstructions,
    toolingInstructions,
  ] = await Promise.all([
    readAgentInstructions("Coder"),
    readAgentInstructions("Tester"),
    readAgentInstructions("Critic"),
    readAgentInstructions("TeamLead"), // Correct casing
    readAgentInstructions("Tooling"),
  ])
  log.info("CLI_AGENTS_INSTR_LOADED", "Instructions loaded for CLI agents.")

  const baseDependencies: Omit<AgentDependencies, "agents"> = {
    apiKey,
    modelName,
    allTools,
    log, // Use the compatible logger
    systemEvents,
    sandbox,
    eventId,
  }

  // Create agents using the base dependencies and specific instructions
  const coder = createCodingAgent({
    ...baseDependencies,
    instructions: coderInstructions,
  })
  const tester = createTesterAgent({
    ...baseDependencies,
    instructions: testerInstructions,
  })
  const critic = createCriticAgent({
    ...baseDependencies,
    instructions: criticInstructions,
  })
  const teamLead = createTeamLeadAgent({
    ...baseDependencies,
    instructions: teamLeadInstructions,
  })
  const tooling = createToolingAgent({
    ...baseDependencies,
    instructions: toolingInstructions,
  })

  const agents: CliAgents = {
    coder: createCodingAgent(coderDeps) as Agent<TddNetworkState>,
    tester: createTesterAgent(testerDeps) as Agent<TddNetworkState>,
    critic: createCriticAgent(criticDeps) as Agent<TddNetworkState>,
    teamLead: createTeamLeadAgent(teamLeadDeps) as Agent<TddNetworkState>,
    tooling: createToolingAgent(toolingDeps) as Agent<TddNetworkState>,
  }

  log.info("CLI_AGENTS_READY", "CLI agents created successfully.")
  return agents
}
