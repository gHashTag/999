import { describe, it, expect, beforeEach } from "bun:test"
import { createCriticAgent } from "@/agents/critic/logic/createCriticAgent" // Corrected path
import {
  createBaseMockDependencies,
  type AgentDependencies,
} from "../setup/testSetupFocused"

// Global setup hook handles beforeEach

describe("Critic Agent Unit Tests", () => {
  let baseDeps: AgentDependencies

  beforeEach(() => {
    baseDeps = createBaseMockDependencies()
  })

  it("should create a Critic agent with correct properties", () => {
    const agent = createCriticAgent(baseDeps, "Test instructions")
    expect(agent.name).toBe("Critic")
    expect(agent.description).toBeDefined()
    expect(agent.model).toBe(baseDeps.model)
  })

  it("should filter tools, expecting only web_search", () => {
    const agent = createCriticAgent(baseDeps, "Test instructions")
    expect(agent.tools.size).toBe(1)
    expect(agent.tools.has("web_search")).toBe(true)
    expect(agent.tools.has("readFile")).toBe(false)
    expect(agent.tools.has("updateTaskState")).toBe(false)
    expect(agent.tools.has("mcp_cli-mcp-server_run_command")).toBe(false)
  })
})
