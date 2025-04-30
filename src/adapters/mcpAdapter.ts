import type { /* HandlerLogger, */ AgentDependencies } from "../types/agents"
import type { Tool /*, Options Agent */ } from "@inngest/agent-kit"
import { mockKv } from "../__tests__/setup/testSetupFocused"

export function createMCPAdapter(deps: AgentDependencies) {
  const { allTools, log: logger, agents = {}, ...rest } = deps
  const mcpTools: Tool.Any[] = allTools.filter(
    (t: Tool.Any) => t && t.name?.startsWith("mcp_")
  )

  const mockNetworkForOpts = {
    state: { kv: mockKv },
    invoke: async () => {},
    sleep: async () => {},
    waitForEvent: async () => ({}) as any,
    sendEvent: async () => [],
    getEvent: () => ({}) as any,
    getFunction: () => ({}) as any,
    getStep: () => ({}) as any,
    run: async () => ({}) as any,
  }

  return {
    mcpTools,
    logger,
    agents,
    ...rest,
    async run(toolName: string, ...args: unknown[]): Promise<unknown> {
      const tool = mcpTools.find((t: Tool.Any) => t.name === toolName)
      if (!tool) {
        logger?.error?.("mcpAdapter.error", {
          toolName,
          args,
          message: "Tool not found or not an MCP tool",
        })
        throw new Error(`Tool ${toolName} is not an MCP tool`)
      }
      try {
        const params = args[0]
        logger?.info?.("mcpAdapter.run", { toolName, params })
        const mockOpts: any = {
          agent: this as any,
          network: mockNetworkForOpts as any,
          invocation: { id: "mock-invocation", ts: Date.now() },
          step: { id: "mock-step", ts: Date.now() } as any,
          resources: {},
        }
        return await tool.handler(params as any, mockOpts as any)
      } catch (err) {
        logger?.error?.("mcpAdapter.error", { toolName, err, attempt: 1 })
        try {
          const params = args[0]
          const mockOpts: any = {
            agent: this as any,
            network: mockNetworkForOpts as any,
            invocation: { id: "mock-invocation-retry", ts: Date.now() },
            step: { id: "mock-step-retry", ts: Date.now() } as any,
            resources: {},
          }
          return await tool.handler(params as any, mockOpts as any)
        } catch (err2) {
          logger?.error?.("mcpAdapter.error", {
            toolName,
            err: err2,
            attempt: 2,
          })
          throw err2
        }
      }
    },
    async kvSet(key: string, value: unknown): Promise<void> {
      logger?.info?.("mcpAdapter.kvSet", { key, value })
      ;(global as any).__mcpKV = (global as any).__mcpKV || {}
      ;(global as any).__mcpKV[key] = value
    },
    async kvGet(key: string): Promise<unknown> {
      logger?.info?.("mcpAdapter.kvGet", { key })
      return (global as any).__mcpKV ? (global as any).__mcpKV[key] : undefined
    },
    logError(error: Error): void {
      logger?.error?.(error)
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
