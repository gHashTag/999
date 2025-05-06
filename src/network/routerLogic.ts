import { Agent } from "@inngest/agent-kit"
// import type { Agents } from "@inngest/agent-kit" // Removed import for non-existent type
import { /*TddNetworkState,*/ NetworkStatus } from "@/types/network" // Removed unused TddNetworkState
import type { HandlerLogger } from "@/types/agents"

// Define simplified types for router function arguments
interface SimplifiedRouterOpts {
  network: {
    state: {
      kv: {
        get: (key: string) => Promise<any>
        set: (key: string, value: any) => Promise<void>
      }
    }
    getAgents: () => Promise<Record<string, Agent<any>>>
  }
  dependencies: {
    log: HandlerLogger // Use HandlerLogger type
    // Add other dependencies if needed
  }
}

interface SimplifiedStepResult {
  nextAgent?: Agent<any>
  result?: string
}

/**
 * Default router logic for the TDD Agent Network.
 * Determines the next agent to run based on the current network state.
 * NOTE: This is currently NOT used as the standard AgentKit router.
 */
export const defaultRouter = async (
  opts: SimplifiedRouterOpts // Use simplified opts type
): Promise<SimplifiedStepResult> => {
  // Use simplified result type
  const status = await opts.network.state.kv.get("status")
  const agents = await opts.network.getAgents()
  const log = opts.dependencies.log // Use HandlerLogger now

  log.info("defaultRouter_start", { status })

  // Use Record<string, Agent<any>> for the type
  const typedAgents: Record<string, Agent<any>> = {
    teamLead: agents.teamLead,
    tester: agents.tester,
    coder: agents.coder,
    critic: agents.critic,
    tooling: agents.tooling,
  }

  try {
    switch (status) {
      case NetworkStatus.Enum.NEEDS_TEAMLEAD_INPUT:
      case NetworkStatus.Enum.NEEDS_REQUIREMENTS:
        // Start: Ask TeamLead for requirements
        await opts.network.state.kv.set(
          "status",
          NetworkStatus.Enum.NEEDS_REQUIREMENTS_CRITIQUE
        )
        return { nextAgent: typedAgents.teamLead }

      case NetworkStatus.Enum.NEEDS_REQUIREMENTS_CRITIQUE:
        // Requirements ready: Ask Critic to review them
        // Critic's approval implicitly leads to needing a test
        await opts.network.state.kv.set(
          "status",
          NetworkStatus.Enum.NEEDS_TEST // Set status for Tester after Critic review
        )
        return { nextAgent: typedAgents.critic }

      case NetworkStatus.Enum.NEEDS_TEST:
        // Test needed: Ask Tester to generate/provide the test
        await opts.network.state.kv.set(
          "status",
          NetworkStatus.Enum.NEEDS_TEST_CRITIQUE // After Tester, Critic reviews the test
        )
        return { nextAgent: typedAgents.tester }

      case NetworkStatus.Enum.NEEDS_TEST_CRITIQUE:
        // Test ready/reviewed: Ask Critic to review it (or check if it was approved)
        // Critic's approval implicitly leads to needing code
        await opts.network.state.kv.set(
          "status",
          NetworkStatus.Enum.NEEDS_CODE // Set status for Coder after Critic test review
        )
        return { nextAgent: typedAgents.critic }

      case NetworkStatus.Enum.NEEDS_CODE:
        // Code needed: Ask Coder to write implementation
        await opts.network.state.kv.set(
          "status",
          NetworkStatus.Enum.NEEDS_TYPE_CHECK // After Coder, Tooling checks types
        )
        return { nextAgent: typedAgents.coder }

      case NetworkStatus.Enum.NEEDS_TYPE_CHECK:
        // Type check needed: Ask Tooling to perform it
        await opts.network.state.kv.set(
          "status",
          NetworkStatus.Enum.NEEDS_COMMAND_EXECUTION // After type check, Tooling runs tests
        )
        return { nextAgent: typedAgents.tooling }

      case NetworkStatus.Enum.NEEDS_COMMAND_EXECUTION:
        // Command (tests) executed: Ask Critic to review implementation
        await opts.network.state.kv.set(
          "status",
          NetworkStatus.Enum.NEEDS_IMPLEMENTATION_CRITIQUE
        )
        return { nextAgent: typedAgents.critic }

      case NetworkStatus.Enum.NEEDS_IMPLEMENTATION_CRITIQUE:
        // Implementation reviewed/refactored: Cycle complete
        await opts.network.state.kv.set("status", NetworkStatus.Enum.COMPLETED)
        return { result: "COMPLETED" }

      // --- Other States ---
      case NetworkStatus.Enum.COMPLETED:
        log.info("defaultRouter_already_completed")
        return { result: "COMPLETED" }

      case NetworkStatus.Enum.FAILED:
        log.warn("defaultRouter_failed_state")
        return { result: "FAILED" }

      case NetworkStatus.Enum.NEEDS_HUMAN_INPUT:
        log.info("defaultRouter_human_input_needed")
        return { result: "NEEDS_HUMAN_INPUT" }

      // Handle removed/renamed intermediate states gracefully if encountered
      case NetworkStatus.Enum.NEEDS_IMPLEMENTATION_REVISION:
      case NetworkStatus.Enum.NEEDS_COMMAND_VERIFICATION:
        log.warn("defaultRouter_unexpected_intermediate_status", { status })
        // Decide recovery path, e.g., go back to critic or fail
        await opts.network.state.kv.set(
          "status",
          NetworkStatus.Enum.NEEDS_IMPLEMENTATION_CRITIQUE
        )
        return { nextAgent: typedAgents.critic } // Or { result: "FAILED" }

      default:
        log.error("defaultRouter_unknown_status", { status })
        await opts.network.state.kv.set("status", NetworkStatus.Enum.FAILED)
        await opts.network.state.kv.set("error", `Unknown status: ${status}`)
        return { result: "FAILED" }
    }
  } catch (error: any) {
    log.error("defaultRouter_exception", {
      error: error.message,
      stack: error.stack,
    })
    await opts.network.state.kv.set("status", NetworkStatus.Enum.FAILED)
    await opts.network.state.kv.set(
      "error",
      error.message || "Router exception"
    )
    return { result: "FAILED" }
  }
}
// Note: The closing brace causing the original error should be implicitly removed by replacing the content.
// If the error persists, the issue might be elsewhere or the file wasn't saved correctly.
