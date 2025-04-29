import { describe, it, expect, beforeEach /*, mock*/ } from "bun:test" // Removed unused mock
import { createTesterAgent } from "@/agents/tester/logic/createTesterAgent"
// Use correct type import
import type { AgentDependencies /*, HandlerLogger*/ } from "@/types/agents" // Removed unused HandlerLogger
// Remove incorrect import
// import { AgentDependencies as NewAgentDependencies } from "@/lib/types"
// import { EventEmitter } from "events" // Removed unused import
// Use types from testSetupFocused
import {
  createBaseMockDependencies,
  // mockLogger as centralMockLogger, // Removed unused import
  getMockTools,
  // Removed setupTestEnvironment, AnyTool
  // setupTestEnvironmentFocused, // Remove unused import
  mockLogger,
  mockDeepseekModelAdapter,
  // setupTestEnvironment, // Removed unused
  // findToolMock, // Removed unused
} from "../testSetup" // Corrected path

// Remove unused imports
// import { AnyTool, ToolName, getMockTools } from "../testSetupFocused"

// Removed unused mockLogger definition
// const mockLogger: HandlerLogger = {
//   ...centralMockLogger,
//   log: mock(() => {}),
// } as unknown as HandlerLogger

// Removed local baseMockDependencies definition
// const baseMockDependencies: Omit<AgentDependencies, "agents" | "instructions"> =
//   { ... }

describe("createTesterAgent", () => {
  // Define common dependencies and instructions
  let baseDeps: Partial<AgentDependencies>
  let testerInstructions: string
  let toolsForTest: any[]

  beforeEach(() => {
    baseDeps = createBaseMockDependencies()
    testerInstructions = "Default tester instructions"
    // Define tools typically needed/filtered by Tester
    toolsForTest = getMockTools(["runTerminalCommand", "web_search"])
    // setupTestEnvironmentFocused() called by global hook
  })

  it("should create a Tester Agent with default dependencies", () => {
    const completeDeps: AgentDependencies = {
      ...baseDeps,
      log: mockLogger,
      model: mockDeepseekModelAdapter,
      allTools: [],
      agents: {},
    } as AgentDependencies

    const agent = createTesterAgent(completeDeps, testerInstructions)

    expect(agent).toBeDefined()
    expect(agent.name).toBe("agent-tester")
    expect(agent.description).toContain("QA")
  })

  it("should include expected tools if provided", () => {
    const completeDeps: AgentDependencies = {
      ...baseDeps,
      log: mockLogger,
      model: mockDeepseekModelAdapter,
      allTools: toolsForTest, // Provide tools
      agents: {},
    } as AgentDependencies

    const agent = createTesterAgent(completeDeps, testerInstructions)
    expect(agent.tools.size).toBe(toolsForTest.length)
    expect(agent.tools.has("runTerminalCommand")).toBe(true)
    expect(agent.tools.has("web_search")).toBe(true)
  })

  it("should generate a system prompt containing core instructions", () => {
    const completeDeps: AgentDependencies = {
      ...baseDeps,
      log: mockLogger,
      model: mockDeepseekModelAdapter,
      allTools: [],
      agents: {},
    } as AgentDependencies

    const agent = createTesterAgent(completeDeps, testerInstructions)
    const systemPrompt = agent.system
    expect(systemPrompt).toBeDefined()
    expect(systemPrompt).toBe(testerInstructions)
    expect(systemPrompt).toContain("инженер по качеству")
  })

  // Add more tests if needed
})
