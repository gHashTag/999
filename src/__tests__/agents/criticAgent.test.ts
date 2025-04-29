import { describe, it, expect, beforeEach /*, mock*/ } from "bun:test"
import {
  // setupTestEnvironmentFocused, // Removed old helper
  // testAgentSystemPrompt, // Removed old helper
  // mockTools, // Removed direct import of all mock tools
  getMockTools, // Use helper to get specific tools
  createBaseMockDependencies, // Use base dependency creator
  // AnyTool, // Removed old type
  // setupTestEnvironmentFocused, // Remove unused import
  // mockLogger, // Removed unused import
  // mockDeepseekModelAdapter, // Removed unused import
} from "../testSetupFocused"
import { type Tool } from "@inngest/agent-kit" // Import correct Tool type
import { createCriticAgent } from "@/agents/critic/logic/createCriticAgent"
// import { Agent } from "@inngest/agent-kit" // Remove unused import
import type { AgentDependencies /*, HandlerLogger*/ } from "@/types/agents" // Remove unused HandlerLogger

// Define required tools using the helper
// const criticRequiredToolNames = ["updateTaskState", "web_search"] // Remove unused variable

describe("createCriticAgent Unit Tests", () => {
  // Define common dependencies and instructions
  let baseDeps: AgentDependencies // Use AgentDependencies directly
  let criticInstructions: string
  let toolsForTest: Tool<any>[]

  beforeEach(() => {
    baseDeps = createBaseMockDependencies()
    criticInstructions = "опытный старший инженер" // Updated instructions
    // Define tools typically needed/filtered by Critic
    toolsForTest = getMockTools(["web_search"])
    // setupTestEnvironmentFocused() called by global hook
  })

  it("should create a Critic Agent with default dependencies", () => {
    const completeDeps: AgentDependencies = { ...baseDeps, allTools: [] } // Provide empty tools for this check
    const agent = createCriticAgent(completeDeps, criticInstructions)

    expect(agent).toBeDefined()
    expect(agent.name).toBe("Critic") // Correct name
    expect(agent.description).toBe(
      "Оценивает код, тесты или результаты выполнения команд, выполняет рефакторинг."
    )
    expect(agent.system).toContain("старший инженер") // Check prompt content
  })

  it("should include web_search tool if provided", () => {
    const completeDeps: AgentDependencies = {
      ...baseDeps,
      allTools: toolsForTest,
    }
    const agent = createCriticAgent(completeDeps, criticInstructions)
    expect(agent.tools.size).toBe(1)
    expect(agent.tools.has("web_search")).toBe(true)
  })

  it("should generate a system prompt containing core instructions", () => {
    const completeDeps: AgentDependencies = { ...baseDeps, allTools: [] }
    const agent = createCriticAgent(completeDeps, criticInstructions)
    const systemPrompt = agent.system
    expect(systemPrompt).toBeDefined()
    expect(systemPrompt).toBe(criticInstructions) // Check full prompt
    expect(systemPrompt).toContain("опытный старший инженер") // Check specific content
  })

  // Add more tests if needed for specific Critic logic
})
