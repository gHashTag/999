import {
  createTeamLeadAgent,
  createTesterAgent,
  createCodingAgent,
  createCriticAgent,
  createToolingAgent,
} from "@/agents"
// import { createToolingAgent as toolingAgent } from "@/agents/tooling/logic/createToolingAgent" // Removed unused
import { type AgentDependencies, type Agents } from "@/types/agents"
import { getAllTools } from "@/tools/toolDefinitions"
import { getSandbox } from "@/inngest/utils/sandboxUtils"
// import { systemEvents } from "@/utils/logic/systemEvents" // Removed unused
import type { HandlerLogger } from "@/types/agents"
import { HandlerStepName } from "@/types/handlerSteps"
import { TddNetworkState } from "@/types/network"
import { Agent } from "@inngest/agent-kit"
// FIX: Comment out potentially incorrect import
// import { deepseek } from "@/inngest/ai/models"
import type {
  BaseLogger,
  KvStore,
  Sandbox,
  // SystemEvents, // Removed unused
} from "@/types/agents"
import { type Tool } from "@inngest/agent-kit"
// Импортируем синглтон KV - ЗАКОММЕНТИРОВАНО ДЛЯ ТЕСТА
// import { kvStoreSingletonInstance } from "@/utils/kv/kvStoreSingletonInstance"

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
    "Creating agent dependencies...", // String message first
    { step: HandlerStepName.CREATE_AGENTS_START, sandboxId, eventId }
  )

  // 1. Create Tools
  const allTools = getAllTools(logger, getSandbox, sandboxId, eventId)
  logger.info(
    "Tools created.", // String message first
    {
      step: HandlerStepName.CREATE_TOOLS_END,
      sandboxId,
      eventId,
      toolCount: allTools.length,
    }
  )

  // 2. Create Base Dependencies
  const apiKey = process.env.DEEPSEEK_API_KEY
  const modelName = process.env.DEEPSEEK_MODEL || "deepseek-coder"
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY environment variable is not set.")
  }

  // FIX: Comment out model creation until import is fixed
  // const model = deepseek({ apiKey, model: modelName })
  const sandboxInstance = await getSandbox(sandboxId)
  // Получаем экземпляр KV - ЗАКОММЕНТИРОВАНО ДЛЯ ТЕСТА
  // const kvInstance = kvStoreSingletonInstance

  const baseDeps: Omit<AgentDependencies, "agents" | "model"> = {
    allTools,
    log: logger as BaseLogger,
    apiKey,
    modelName,
    // FIX: Remove model until import is fixed
    // model,
    systemEvents: {} as any, // Provide dummy object
    sandbox: sandboxInstance as any, // Cast sandbox
    eventId,
    // Добавляем kv - ЗАКОММЕНТИРОВАНО ДЛЯ ТЕСТА
    // kv: kvInstance,
    kv: undefined, // Явно ставим undefined, пока KV не реализован
  }

  // Use placeholder instructions directly
  const coderInstructions = "Placeholder Coder Instructions"
  const testerInstructions = "Placeholder Tester Instructions"
  const teamLeadInstructions = "Placeholder TeamLead Instructions"
  const criticInstructions = "Placeholder Critic Instructions"
  const toolingInstructions = "Placeholder Tooling Instructions"

  // 4. Create Agent Instances with Instructions
  const teamLead = createTeamLeadAgent(baseDeps, teamLeadInstructions)
  const tester = createTesterAgent(baseDeps, testerInstructions)
  // FIX: Pass arguments correctly
  // const coder = createCodingAgent({
  //   ...baseDeps,
  //   instructions: coderInstructions,
  // })
  const coder = createCodingAgent(baseDeps, coderInstructions)
  const critic = createCriticAgent(baseDeps, criticInstructions)
  // FIX: Pass arguments correctly (single object including instructions)
  // const tooling = createToolingAgent(baseDeps)
  const tooling = createToolingAgent(
    {
      ...baseDeps,
    },
    ""
  )

  // 5. Construct Final Agents Object
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
    "Agent dependencies created.", // String message first
    {
      step: HandlerStepName.CREATE_AGENTS_END,
      sandboxId,
      eventId,
      agentNames: Object.keys(agents),
    }
  )
  return fullAgentDeps
}

/**
 * Creates agent instances with necessary dependencies.
 * DEPRECATED: Use createAgentDependencies which handles everything.
 */
export const createAgents = (
  logger: HandlerLogger,
  kvStore: KvStore,
  _systemEvents: any,
  _sandbox: Sandbox | null,
  apiKey: string,
  modelName: string,
  eventId: string,
  allTools: Tool<any>[]
): Agents => {
  logger.info(
    "Creating agents (DEPRECATED)...", // String message first
    { step: HandlerStepName.CREATE_AGENTS_START }
  )

  const baseAgentDeps: Omit<AgentDependencies, "agents" | "model"> = {
    log: logger as BaseLogger,
    kv: kvStore,
    systemEvents: _systemEvents,
    sandbox: _sandbox,
    apiKey,
    modelName,
    eventId,
    allTools,
  }

  const teamLeadInstructions = "...TeamLead Instructions..."
  const testerInstructions = "...Tester Instructions..."
  const coderInstructions = "...Coder Instructions..."
  const criticInstructions = "...Critic Instructions..."

  const agents: Agents = {
    teamLead: createTeamLeadAgent(
      baseAgentDeps as AgentDependencies,
      teamLeadInstructions
    ),
    tester: createTesterAgent(
      baseAgentDeps as AgentDependencies,
      testerInstructions
    ),
    coder: createCodingAgent(
      baseAgentDeps as AgentDependencies,
      coderInstructions
    ),
    critic: createCriticAgent(
      baseAgentDeps as AgentDependencies,
      criticInstructions
    ),
    // FIX: Pass arguments correctly (single object including instructions)
    // tooling: createToolingAgent(baseAgentDeps as AgentDependencies),
    tooling: createToolingAgent(
      {
        ...baseAgentDeps,
      },
      ""
    ),
  }

  logger.info(
    "Agents created (DEPRECATED).", // String message first
    {
      step: HandlerStepName.CREATE_AGENTS_END,
      agentNames: Object.keys(agents),
    }
  )
  return agents
}
