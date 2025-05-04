import { mockKv } from "@/__tests__/setup/testSetup"
import type { /* HandlerLogger, */ AgentDependencies } from "../types/agents"
import type { Tool /*, Options Agent */ } from "@inngest/agent-kit"
// import type { ToolMetadata } from "@/types/tools"
// import { logger } from "@/utils/logger"

export function createMCPAdapter(deps: AgentDependencies) {
  const { allTools, log: logger, agents = {}, kv = mockKv, ...rest } = deps
  const mcpTools: Tool.Any[] = allTools.filter(
    (t: Tool.Any) => t && t.name?.startsWith("mcp_")
  )

  const mockNetworkForOpts = {
    state: { kv: kv },
    invoke: async () => {},
    sleep: async () => {},
    waitForEvent: async () => ({}) as any,
    sendEvent: async () => [],
    getEvent: () => ({}) as any,
    getFunction: () => ({}) as any,
    getStep: () => ({}) as any,
    run: async () => ({}) as any,
  }

  // --- Helper Function for Response Validation ---
  const _validateAndLogResponseFormat = (
    result: unknown,
    toolName: string,
    attempt: number
  ): { isValid: boolean; errorResult?: { error: string } } => {
    if (
      typeof result !== "object" ||
      result === null ||
      !("output" in result)
    ) {
      const errorMsg = `Invalid response format from MCP tool on attempt ${attempt}`
      logger?.error?.("mcpAdapter.error", {
        toolName,
        error: errorMsg,
        response: result,
        attempt,
      })
      return { isValid: false, errorResult: { error: errorMsg } }
    }
    return { isValid: true }
  }
  // --- End Helper Function ---

  // --- Helper Function for Delay ---
  const _delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
  // --- End Helper Function ---

  return {
    mcpTools,
    logger,
    agents,
    kv,
    ...rest,
    async run(toolName: string, ...args: unknown[]): Promise<unknown> {
      const tool = mcpTools.find((t: Tool.Any) => t.name === toolName)
      if (!tool) {
        const errorMsg = `Tool ${toolName} is not an MCP tool`
        logger?.error?.("mcpAdapter.error", {
          toolName,
          args,
          message: errorMsg,
        })
        throw new Error(errorMsg)
      }
      logger?.info?.("mcpAdapter.run_start", { toolName, params: args[0] })

      let attempt = 1
      try {
        const params = args[0]
        const mockOpts: any = {
          agent: this as any,
          network: mockNetworkForOpts as any,
          invocation: { id: `mock-invocation-att${attempt}`, ts: Date.now() },
          step: { id: `mock-step-att${attempt}`, ts: Date.now() } as any,
          resources: {},
        }
        const result = await tool.handler(params as any, mockOpts as any)

        // Validate format using helper
        const validation = _validateAndLogResponseFormat(
          result,
          toolName,
          attempt
        )
        if (!validation.isValid) {
          return validation.errorResult
        }

        logger?.info?.("mcpAdapter.run_success", { toolName, result, attempt })
        return result
      } catch (err) {
        const is429Error = err instanceof Error && (err as any).status === 429
        logger?.error?.("mcpAdapter.error", {
          toolName,
          err,
          attempt,
          status: is429Error ? 429 : undefined,
        })

        attempt++ // Increment attempt count
        if (attempt > 2) {
          throw err // Max retries exceeded
        }

        // Retry logic: wait specifically for 429, retry others immediately
        if (is429Error) {
          const retryDelay = 50 // ms
          logger?.info?.("mcpAdapter.retry_delay", {
            toolName,
            delay: retryDelay,
          })
          await _delay(retryDelay) // Wait before retrying 429
        }

        // Retry attempt (common for all errors after potential delay)
        try {
          const params = args[0]
          const mockOptsRetry: any = {
            agent: this as any,
            network: mockNetworkForOpts as any,
            invocation: { id: `mock-invocation-att${attempt}`, ts: Date.now() },
            step: { id: `mock-step-att${attempt}`, ts: Date.now() } as any,
            resources: {},
          }
          const resultRetry = await tool.handler(
            params as any,
            mockOptsRetry as any
          )

          // Validate format on retry result using helper
          const validationRetry = _validateAndLogResponseFormat(
            resultRetry,
            toolName,
            attempt
          )
          if (!validationRetry.isValid) {
            return validationRetry.errorResult
          }

          logger?.info?.("mcpAdapter.run_success", {
            toolName,
            result: resultRetry,
            attempt,
          })
          return resultRetry
        } catch (err2) {
          const is429ErrorRetry =
            err2 instanceof Error && (err2 as any).status === 429
          logger?.error?.("mcpAdapter.error", {
            toolName,
            err: err2,
            attempt,
            status: is429ErrorRetry ? 429 : undefined,
          })
          throw err2 // Rethrow final error
        }
      }
    },
    async kvSet(key: string, value: unknown): Promise<void> {
      logger?.info?.("mcpAdapter.kvSet", { key, value })
      await kv.set(key, value)
    },
    async kvGet(key: string): Promise<unknown> {
      logger?.info?.("mcpAdapter.kvGet", { key })
      return await kv.get(key)
    },
    /** Logs an error message, potentially enriching it with adapter context */
    logError(error: Error | string, context?: Record<string, unknown>): void {
      const message = error instanceof Error ? error.message : error
      const stack = error instanceof Error ? error.stack : undefined
      // Pass string message first
      logger?.error?.(message, {
        adapter: "MCPAdapter",
        ...(context || {}),
        error: message, // Keep error message in context too
        stack: stack,
      })
    },
    async sendToAgent(agentName: string, message: unknown): Promise<void> {
      logger?.info?.("mcpAdapter.sendToAgent", { agentName, message })
      let agent
      if (Array.isArray(agents)) {
        agent = agents.find(a => a.name === agentName)
      } else {
        agent = agents[agentName]
      }
      if (!agent || typeof agent.send !== "function") {
        logger?.error?.("mcpAdapter.error", {
          agentName,
          message,
          availableAgents: Array.isArray(agents)
            ? agents.map(a => a.name)
            : Object.keys(agents),
        })
        return
      }
      await agent.send(message)
    },
  }
}
