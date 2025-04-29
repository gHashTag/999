import { Agent, Network /*, type NetworkRun*/ } from "@inngest/agent-kit"
import { TddNetworkState, NetworkStatus } from "@/types/network"
import { type Agents, type HandlerLogger } from "@/types/agents"
// Removed direct import of log, assuming it's passed via dependencies
// import { log } from "@/utils/logic/logger"

// Type definition for the agents structure passed to chooseNextAgent
// Removed unused type definition AgentsMap

// Removed unused interface RouteArgs

/**
 * Parses the state from the network's KV store and initializes it if necessary.
 * @param network - The agent network instance.
 * @returns The parsed or initialized TddNetworkState.
 */
export function parseAndInitializeState(
  network: Network<TddNetworkState>
): TddNetworkState {
  const state = network.state.kv.all()
  // Ensure basic structure if state is empty
  if (!state || Object.keys(state).length === 0) {
    return {
      status: NetworkStatus.Enum.IDLE,
      task: "Initial task description missing",
      sandboxId: undefined,
      run_id: "unknown",
    }
  }
  // Safer cast
  return state as unknown as TddNetworkState
}

/**
 * Chooses the next agent based on the current network state.
 * @param state - The current network state.
 * @param agents - An object containing the agent instances.
 * @returns The next agent to run, or undefined to stop the network.
 */
// FIX: Update parameter type to use imported Agents type
export function chooseNextAgent(
  state: TddNetworkState,
  agents: Agents // Use imported Agents type
): Agent<TddNetworkState> | undefined {
  switch (state.status) {
    case NetworkStatus.Enum.IDLE:
    case NetworkStatus.Enum.READY:
      return agents.teamLead // Start with TeamLead
    case NetworkStatus.Enum.NEEDS_REQUIREMENTS_CRITIQUE:
      return agents.critic
    case NetworkStatus.Enum.NEEDS_TEST:
    case NetworkStatus.Enum.NEEDS_TEST_REVISION:
      return agents.tester
    case NetworkStatus.Enum.NEEDS_TEST_CRITIQUE:
      return agents.critic
    // FIX: Use NEEDS_CODE instead of non-existent NEEDS_IMPLEMENTATION
    case NetworkStatus.Enum.NEEDS_CODE:
    case NetworkStatus.Enum.NEEDS_IMPLEMENTATION_REVISION:
      return agents.coder
    case NetworkStatus.Enum.NEEDS_TYPE_CHECK: // Added type check step
    case NetworkStatus.Enum.NEEDS_COMMAND_EXECUTION:
      return agents.tooling // Tooling agent handles type checks and commands
    case NetworkStatus.Enum.NEEDS_IMPLEMENTATION_CRITIQUE:
      return agents.critic
    case NetworkStatus.Enum.COMPLETED:
    case NetworkStatus.Enum.FAILED:
    case NetworkStatus.Enum.NEEDS_HUMAN_INPUT: // Added case for human input stop
      return undefined // Stop the network
    default:
      console.error(`Unknown network status: ${state.status}`)
      return undefined // Stop on unknown status
  }
}

/**
 * Saves the current state to the network's KV store.
 * @param network - The agent network instance.
 * @param state - The state object to save.
 */
export function saveStateToKv(
  network: Network<TddNetworkState>,
  state: TddNetworkState | null,
  log: HandlerLogger // Pass logger for saving state logs
) {
  if (state) {
    log.info(
      { step: "KV_SET_BEFORE_RETURN" }, // Using step identifier
      "Saving state to KV.",
      { status: state.status, sandboxId: state.sandboxId }
    )
    // Add detailed log of the state being saved
    log.info({ step: "KV_SET_VALUE" }, "State value being saved:", {
      // Limit logged state for brevity if needed
      stateToSave: JSON.stringify(state).substring(0, 500) + "...",
    })
    network?.state?.kv?.set("network_state", state)
  } else {
    log.warn({ step: "KV_SET_SKIP" }, "Skipping KV set because state is null.")
  }
}

// Removed unused shouldStop function

// Updated defaultRouter to accept log
export const defaultRouter = async ({
  network,
  log,
}: {
  network: Network<TddNetworkState>
  log: HandlerLogger // Expect log to be passed in
}): Promise<Agent<TddNetworkState> | undefined> => {
  const routerIterationStart = Date.now() // Timestamp for iteration start
  log.info(
    { step: "ROUTER_ITERATION_START" }, // Add step identifier
    "Router iteration starting.",
    {
      iterationStart: routerIterationStart,
      currentStatus: network.state.kv.get("status"), // Log status at start
    }
  )

  const state = parseAndInitializeState(network)
  const currentSandboxId = state.sandboxId || null

  // FIX: Correctly reconstruct the Agents object from the network.agents Map
  const agentsMap = new Map(network.agents.entries())
  const agents: Agents = {
    teamLead: agentsMap.get("agent-teamlead") as Agent<TddNetworkState>,
    tester: agentsMap.get("agent-tester") as Agent<TddNetworkState>,
    coder: agentsMap.get("agent-coder") as Agent<TddNetworkState>,
    critic: agentsMap.get("agent-critic") as Agent<TddNetworkState>,
    tooling: agentsMap.get("agent-tooling") as Agent<TddNetworkState>,
  }

  // Ensure all agents were found in the map
  if (Object.values(agents).some(agent => !agent)) {
    log.error(
      { step: "ROUTER_AGENT_MISSING" },
      "Could not find one or more required agents in network.agents map.",
      {
        foundAgents: Array.from(agentsMap.keys()),
        expectedAgents: [
          "agent-teamlead",
          "agent-tester",
          "agent-coder",
          "agent-critic",
          "agent-tooling",
        ],
      }
    )
    // Potentially update state to FAILED here
    state.status = NetworkStatus.Enum.FAILED
    state.error = "Router setup error: Agent mapping failed."
    saveStateToKv(network, state, log)
    return undefined // Stop the network
  }

  const nextAgent = chooseNextAgent(state, agents)

  // Save state regardless of whether an agent is chosen (might have been modified)
  // Pass the logger to saveStateToKv
  saveStateToKv(network, state, log)

  const routerIterationEnd = Date.now() // Timestamp for iteration end
  log.info(
    { step: "ROUTER_ITERATION_END" }, // Add step identifier
    "Router iteration finished.",
    {
      // FIX: Use nextAgent?.name instead of nextAgent?.id
      chosenAgent: nextAgent?.name || "None (Stopping)", // Log agent name
      finalStatusInIteration: state?.status,
      durationMs: routerIterationEnd - routerIterationStart,
      sandboxId: currentSandboxId, // Include sandboxId in final log
    }
  )

  return nextAgent // Return the chosen agent (or undefined to stop)
}
