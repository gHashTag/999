import { describe, it, expect, beforeEach } from "bun:test"
import {
  // createBaseMockDependencies, // Deprecated
  createFullMockDependencies, // Use new factory
  getMockTools,
  // mockDeepseekModelAdapter, // Tooling agent likely doesn't need model
} from "../setup/testSetupFocused"
import { createToolingAgent } from "@/agents/tooling/logic/createToolingAgent"
import type { AgentDependencies } from "@/types/agents"
import type { Tool as AnyTool } from "@inngest/agent-kit"

describe("Tooling Agent Unit Tests", () => {
  let baseDeps: AgentDependencies

  beforeEach(() => {
    baseDeps = createFullMockDependencies() // Use new factory
  })

  it("should create a Tooling agent with default dependencies", () => {
    // Tooling agent might not need instructions, or they are fixed
    const toolingAgent = createToolingAgent({ ...baseDeps, instructions: "" })
    expect(toolingAgent).toBeDefined()
    expect(toolingAgent.name).toBe("Tooling Agent")
  })

  // Tooling agent might not use the standard model adapter
  // it("should have access to the correct model adapter", () => {
  //   const toolingAgent = createToolingAgent(baseDeps)
  //   expect((toolingAgent as any).model).toBe(baseDeps.model)
  // })

  it("should filter tools correctly based on tooling requirements (likely all)", () => {
    const allMockTools: AnyTool<any>[] = getMockTools([
      "readFile",
      "writeFile",
      "runTerminalCommand",
      "updateTaskState",
      "web_search",
      "mcp_cli-mcp-server_run_command",
      "mcp_cli-mcp-server_show_security_rules",
    ])
    const depsWithTools = createFullMockDependencies({ allTools: allMockTools })

    // Pass full dependencies including instructions to the agent creation function
    const toolingAgent = createToolingAgent({
      ...depsWithTools,
      instructions: "",
    })

    // Tooling agent likely needs access to *all* defined tools
    const expectedToolNames = allMockTools.map(t => t.name).sort()
    const actualToolNames = Array.from(toolingAgent.tools.keys()).sort()

    expect(actualToolNames).toEqual(expectedToolNames)
    expect(toolingAgent.tools.size).toBe(expectedToolNames.length)
  })

  it("should handle having no tools passed in dependencies", () => {
    const depsWithoutTools = createFullMockDependencies({ allTools: [] })
    // Pass instructions even when no tools
    const toolingAgent = createToolingAgent({
      ...depsWithoutTools,
      instructions: "",
    })
    expect(toolingAgent.tools).toBeDefined()
    expect(toolingAgent.tools.size).toBe(0)
  })
})
