import { Agent, Network, type NetworkRun } from "@inngest/agent-kit"
import { TddNetworkState, NetworkStatus } from "@/types/network"
import { type Agents } from "@/types/agents"
import { HandlerLogger } from "@/types/agents"
import { log } from "@/utils/logic/logger"

// Type definition for the agents structure passed to chooseNextAgent
// FIX: Use the imported Agents type instead of defining AgentsMap
// type AgentsMap = {
//   teamLeadAgent: Agent<any>
//   testerAgent: Agent<any>
//   codingAgent: Agent<any>
//   criticAgent: Agent<any>
//   toolingAgent: Agent<any> // Assuming tooling agent might be needed in future routing
// }

// interface RouteArgs { // Removed unused interface
//   state: TddNetworkState
//   log: HandlerLogger
//   network: Network<TddNetworkState>
//   agents: Agents // Use imported Agents type
//   dependencies: AgentDependencies // Use imported AgentDependencies type
// }

/**
 * Parses the state from the network's KV store and initializes it if necessary.
 * @param network - The agent network instance.
 * @returns The parsed or initialized TddNetworkState.
 */
export function parseAndInitializeState(
  network: Network<TddNetworkState>
): TddNetworkState {
  const rawStateFromKv = network?.state?.kv?.get("network_state")
  const currentSandboxId = (rawStateFromKv as any)?.sandboxId || null

  log("info", "ROUTER_RAW_STATE_VALUE", "Value directly from KV:", {
    rawState: rawStateFromKv
      ? JSON.stringify(rawStateFromKv)
      : "undefined or null",
    sandboxId: currentSandboxId,
  })

  let state: TddNetworkState | null = null
  let parseError: string | null = null
  try {
    if (rawStateFromKv) {
      // TODO: Add Zod parsing here for safety
      state = rawStateFromKv as TddNetworkState
    }
  } catch (e) {
    parseError = e instanceof Error ? e.message : String(e)
  }

  log(
    "info",
    "ROUTER_RAW_STATE",
    `Raw state read from KV: ${parseError ? `PARSE ERROR: ${parseError}` : rawStateFromKv ? "OK" : "null"}`,
    {
      rawState: rawStateFromKv
        ? JSON.stringify(rawStateFromKv)
        : "undefined or null",
      sandboxId: state?.sandboxId || currentSandboxId, // Use parsed state sandboxId if available
    }
  )

  // Initialize state if it wasn't found or couldn't be parsed
  if (!state) {
    state = {
      task: "unknown",
      status: NetworkStatus.Enum.IDLE,
      sandboxId: undefined,
    }
    log(
      "warn",
      "ROUTER_STATE_INIT_FALLBACK",
      "State was null or invalid, using fallback.",
      { sandboxId: state.sandboxId } // Log the sandboxId from the new fallback state
    )
  }

  return state
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
): Agent<any> | undefined {
  const currentStatus = state.status
  const currentSandboxId = state.sandboxId || null

  log("info", "ROUTER_START", `Status read from KV: ${currentStatus}`, {
    status: currentStatus,
    sandboxId: currentSandboxId,
  })

  let nextAgent: Agent<any> | undefined = undefined

  if (!currentStatus || currentStatus === NetworkStatus.Enum.IDLE) {
    log(
      "info",
      "ROUTER_NO_STATUS_OR_IDLE",
      `Status is ${currentStatus || "undefined"}, routing to TeamLead Agent initially.`,
      { sandboxId: currentSandboxId }
    )
    nextAgent = agents.teamLead
  } else {
    switch (currentStatus) {
      case NetworkStatus.Enum.NEEDS_REQUIREMENTS_CRITIQUE:
        log(
          "info",
          "ROUTER_TO_CRITIC_REQUIREMENTS",
          `Status is ${currentStatus}. Routing to Critic Agent for requirements.`,
          { status: currentStatus, sandboxId: currentSandboxId }
        )
        nextAgent = agents.critic
        break

      case NetworkStatus.Enum.NEEDS_TEST:
      case NetworkStatus.Enum.NEEDS_TEST_REVISION:
        log(
          "info",
          "ROUTER_TO_TESTER",
          `Status is ${currentStatus}. Routing to Tester Agent.`,
          { status: currentStatus, sandboxId: currentSandboxId }
        )
        nextAgent = agents.tester
        break

      case NetworkStatus.Enum.NEEDS_IMPLEMENTATION_REVISION:
        log(
          "info",
          "ROUTER_TO_CODER",
          `Status is ${currentStatus}. Routing to Coding Agent.`,
          { status: currentStatus, sandboxId: currentSandboxId }
        )
        nextAgent = agents.coder
        break

      case NetworkStatus.Enum.NEEDS_TEST_CRITIQUE:
      case NetworkStatus.Enum.NEEDS_COMMAND_VERIFICATION:
      case NetworkStatus.Enum.NEEDS_IMPLEMENTATION_CRITIQUE:
        log(
          "info",
          "ROUTER_TO_CRITIC",
          `Status is ${currentStatus}. Routing to Critic Agent.`,
          { status: currentStatus, sandboxId: currentSandboxId }
        )
        nextAgent = agents.critic
        break

      // Stop network loop cases
      case NetworkStatus.Enum.NEEDS_COMMAND_EXECUTION:
        log(
          "info",
          "ROUTER_STOP_FOR_COMMAND",
          "Status is NEEDS_COMMAND_EXECUTION. Stopping agent network loop.",
          { status: currentStatus, sandboxId: currentSandboxId }
        )
        // nextAgent remains undefined
        break
      case NetworkStatus.Enum.COMPLETED:
      case NetworkStatus.Enum.FAILED:
        log(
          "info",
          "ROUTER_STOP_COMPLETED_FAILED",
          `Task already ended with status: ${currentStatus}. Stopping.`,
          { status: currentStatus, sandboxId: currentSandboxId }
        )
        // nextAgent remains undefined
        break
      case NetworkStatus.Enum.NEEDS_HUMAN_INPUT:
        log(
          "info",
          "ROUTER_STOP_FOR_HUMAN",
          "Status is NEEDS_HUMAN_INPUT. Stopping agent network loop.",
          { status: currentStatus, sandboxId: currentSandboxId }
        )
        // nextAgent remains undefined
        break
      default:
        log(
          "error",
          "ROUTER_UNKNOWN_STATUS",
          `Unknown or unhandled status: ${currentStatus}. Stopping.`,
          { status: currentStatus, sandboxId: currentSandboxId }
        )
        // nextAgent remains undefined
        break
    }
  }
  // Log chosen agent
  log(
    "info",
    "ROUTER_END",
    `Chosen agent: ${nextAgent?.name || "None (Stopping)"}`,
    {
      chosenAgent: nextAgent?.name || null,
      status: currentStatus,
      sandboxId: currentSandboxId,
    }
  )

  return nextAgent
}

/**
 * Saves the current state to the network's KV store.
 * @param network - The agent network instance.
 * @param state - The state object to save.
 */
export function saveStateToKv(
  network: Network<TddNetworkState>,
  state: TddNetworkState | null
) {
  if (state) {
    log(
      "info",
      "KV_SET_BEFORE_RETURN", // Reusing this log step name for now
      "Saving state to KV.",
      { status: state.status, sandboxId: state.sandboxId }
    )
    // Add detailed log of the state being saved
    log("info", "KV_SET_VALUE", "State value being saved:", {
      stateToSave: JSON.stringify(state),
    })
    network?.state?.kv?.set("network_state", state)
  } else {
    log("warn", "KV_SET_SKIP", "Skipping KV set because state is null.")
  }
}

const shouldStop = (state: TddNetworkState | null): boolean => {
  if (!state) return true // Stop if no state
  // FIX: Check status equality explicitly to avoid TS2345
  return (
    state.status === NetworkStatus.Enum.COMPLETED ||
    state.status === NetworkStatus.Enum.FAILED ||
    state.status === NetworkStatus.Enum.NEEDS_HUMAN_INPUT
  )
  /* Original check causing TS2345:
  return [
    NetworkStatus.Enum.COMPLETED,
    NetworkStatus.Enum.FAILED,
    NetworkStatus.Enum.NEEDS_HUMAN_INPUT,
  ].includes(state.status) // Error TS2345
  */
}

export const defaultRouter = async (
  run: NetworkRun<TddNetworkState>
): Promise<{ nextAgent: Agent<TddNetworkState> | null }> => {
  const log: HandlerLogger = (run as any).log ?? console

  const currentState = run.state.kv.get(
    "network_state"
  ) as TddNetworkState | null
  log.info(
    { step: "ROUTER_START", status: currentState?.status },
    "Router evaluating state."
  )

  if (shouldStop(currentState)) {
    log.info(
      { step: "ROUTER_STOP", status: currentState?.status },
      "Stopping network run."
    )
    // Ensure state is saved before stopping if needed (might already be saved by the agent)
    if (currentState) {
      run.state.kv.set("network_state", currentState)
      log.info(
        { step: "KV_SET_BEFORE_STOP" },
        "Saved final state before stopping."
      )
    }
    return { nextAgent: null }
  }

  // FIX: Remove fetching agents from run.availableAgents()
  // The agents object should be available from the context where router is called
  // or passed explicitly if this router function were used directly.
  // const agents = (await run.availableAgents()) as Agents // REMOVED

  // Placeholder/Error: Cannot determine agents from run object directly in this standalone function.
  // This router logic is now primarily invoked within createDevOpsNetwork where agents are defined.
  // If used elsewhere, agents must be provided.
  log.error(
    { step: "ROUTER_AGENT_FETCH_ERROR" },
    "Cannot fetch agents directly inside defaultRouter function anymore."
  )
  // Throw an error or return null to indicate failure
  // return { nextAgent: null };
  throw new Error(
    "defaultRouter cannot fetch agents; agents must be provided by caller."
  )

  /* --- REMOVED/REPLACED Logic --- */
  /*
  let chosenAgent: Agent<TddNetworkState> | null = null
  let chosenAgentName = "None"

  // FIX: Use NetworkStatus.Enum.VALUE for all switch cases
  switch (currentState?.status) {
      // ... cases ...
      default:
        log.error(
          { step: "ROUTER_UNKNOWN_STATUS", status: currentState?.status },
          "Unknown network status for routing."
        )
        if (currentState) {
          run.state.kv.set("network_state", {
            ...currentState,
            status: NetworkStatus.Enum.FAILED,
          })
          log.info(
            { step: "KV_SET_BEFORE_STOP_UNKNOWN" },
            "Saved FAILED state before stopping due to unknown status."
          )
        }
        return { nextAgent: null } // Stop on unknown status
    }

  log.info(
    { step: "ROUTER_END", status: currentState?.status },
    `Routing to: ${chosenAgentName}`,
    { chosenAgentName }
  )

  return { nextAgent: chosenAgent }
  */
}
