import { Agent, Network /*, type NetworkRun*/ } from "@inngest/agent-kit"
import { TddNetworkState, NetworkStatus } from "@/types/network"
import { type Agents, type HandlerLogger } from "@/types/agents"
// Remove unused KvStore import
// import type { AgentDependencies, BaseLogger, KvStore } from "@/types/agents"
import type { AgentDependencies, BaseLogger } from "@/types/agents"
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
    // Correct logger call order
    log.info("Saving state to KV.", {
      step: "KV_SET_BEFORE_RETURN",
      status: state.status,
      sandboxId: state.sandboxId,
    })
    // Add detailed log of the state being saved
    // Correct logger call order
    log.info("State value being saved:", {
      step: "KV_SET_VALUE",
      // Limit logged state for brevity if needed
      stateToSave: JSON.stringify(state).substring(0, 500) + "...",
    })
    network?.state?.kv?.set("network_state", state)
  } else {
    // Correct logger call order
    log.warn("Skipping KV set because state is null.", { step: "KV_SET_SKIP" })
  }
}

// Removed unused shouldStop function

// Comment out the problematic saveStateBeforeReturn helper function
/*
async function saveStateBeforeReturn(
  state: State<TddNetworkState>,
  log: BaseLogger,
  eventId?: string
): Promise<void> {
  // FIX: Use get instead of current()
  const currentState = state.kv.get("network_state") // Example, adjust key if needed
  if (currentState) {
    log.info(
      "Saving state before returning/sleeping.", // String message first
      { step: "KV_SET_BEFORE_RETURN", eventId, status: currentState.status }
    )
    try {
      log.info(
        "State value being saved:", // String message first
        { step: "KV_SET_VALUE", value: currentState }
      )
      // FIX: Use set instead of commit() ? Or maybe this function is not needed.
      // await state.kv.set("network_state", currentState); // Example save
      await state.kv.commit() // This method likely doesn't exist
    } catch (error) {
      log.error(
        "Failed to save state to KV store before return.", // String message first
        {
          step: "KV_SET_ERROR",
          eventId,
          error: error instanceof Error ? error.message : String(error),
        }
      )
      // Optionally re-throw or handle the error
    }
  } else {
    log.warn(
      "Skipping KV set because state is null.", // String message first
      { step: "KV_SET_SKIP" }
    )
  }
}
*/

/**
 * Default router logic for the TDD agent network.
 */
// FIX: Remove NetworkRun import as lastRun is removed
import type { State } from "@inngest/agent-kit"

// FIX: Correct return type - Remove RouterResult
export async function defaultRouter(
  state: State<TddNetworkState>,
  dependencies: AgentDependencies,
  // FIX: Remove unused lastRun parameter
  // lastRun: NetworkRun<TddNetworkState> | null,
  log: BaseLogger // Explicitly accept BaseLogger
): Promise<{ agent: Agent<TddNetworkState> | undefined } | undefined> {
  // FIX: Define return type explicitly
  // FIX: Use get instead of current()
  const current = state.kv.get("network_state") as TddNetworkState | undefined // Use get and cast
  const eventId = dependencies.eventId // Get eventId from dependencies

  log.info(
    `Routing based on status: ${current?.status}`, // String message first
    { step: "ROUTER_ITERATION_START", eventId, status: current?.status }
  )

  // FIX: Pass current state and agents from dependencies to chooseNextAgent
  // FIX: Provide default state object if current is undefined
  const defaultState: TddNetworkState = {
    status: NetworkStatus.Enum.IDLE,
    task: "State missing in KV",
    run_id: eventId || "unknown",
    // Add other mandatory fields from TddNetworkState if they exist
    // e.g., test_requirements: undefined, test_code: undefined, ...
  }
  // Cast dependencies.agents to the expected Agents type
  // TODO: Find a better way to ensure type compatibility or refine the Agents type/interface
  // const agents = (dependencies.agents || {}) as Agents
  const agents = dependencies.agents || {} // Use without assertion for now

  // FIX: Cast dependencies.agents to Agents
  const agentToRun = chooseNextAgent(
    current || defaultState,
    // FIX: Restore type cast
    agents as Agents
  )

  if (!agentToRun) {
    log.info("No agent selected by chooseNextAgent. Stopping.", {
      step: "ROUTER_NO_AGENT",
      eventId,
      status: current?.status,
    })
    // Comment out call to removed function
    // await saveStateBeforeReturn(state, log, eventId)
    return undefined // Stop the network if no agent is chosen
  }

  // FIX: Use agentToRun.name instead of undefined nextAgentName
  const nextAgentName = agentToRun.name
  log.info(`Next agent selected: ${nextAgentName}`, {
    step: "ROUTER_AGENT_SELECTED",
    eventId,
    nextAgentName,
  })

  // Check if the chosen agent exists in dependencies
  const agentExists = agents && agents[nextAgentName]
  if (!agentExists) {
    log.error(
      `Agent ${nextAgentName} not found in dependencies.`, // String message first
      {
        step: "ROUTER_AGENT_MISSING",
        eventId,
        requestedAgent: nextAgentName,
        availableAgents: Object.keys(agents || {}),
      }
    )
    // Comment out call to removed function
    // await saveStateBeforeReturn(state, log, eventId)
    return { agent: undefined } // Indicate failure or stop by returning undefined agent
  }

  // Return the chosen agent
  log.info(`Returning agent ${nextAgentName} to run.`, {
    step: "ROUTER_RETURNING_AGENT",
    eventId,
    nextAgentName,
  })
  // Comment out call to removed function
  // await saveStateBeforeReturn(state, log, eventId) // Save state before returning agent
  return { agent: agentToRun }

  // Default case: If status doesn't match, or COMPLETED/FAILED - Handled by chooseNextAgent now
  // log.info(
  //   "No further routing action needed for current status.", // String message first
  //   { step: "ROUTER_ITERATION_END", eventId, status: current?.status }
  // )
  // await saveStateBeforeReturn(state, log, eventId) // Already saved before return
  // return undefined // Stop the network run
}
// Note: The closing brace causing the original error should be implicitly removed by replacing the content.
// If the error persists, the issue might be elsewhere or the file wasn't saved correctly.
