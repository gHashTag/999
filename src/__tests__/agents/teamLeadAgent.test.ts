import { InngestTestEngine } from "@inngest/test"
import { createTeamLeadAgent } from "@/agents/teamlead/logic/createTeamLeadAgent"
import { describe, it, expect, beforeEach /*, mock*/ } from "bun:test" // Removed unused mock
// import type { AgentDependencies /*, HandlerLogger*/ } from "@/types/agents" // Removed duplicate import
// import { EventEmitter } from "events" // Removed unused import
import { Inngest } from "inngest"
import {
  // setupTestEnvironmentFocused as setupTestEnvironment, // Unused alias
  createBaseMockDependencies,
  getMockTools,
  // findToolMock, // Unused
  type AgentDependencies,
  // Import necessary mocks explicitly
  mockLogger,
  mockKv,
  mockDeepseekModelAdapter,
  mockSystemEvents,
} from "../setup/testSetupFocused" // Corrected path
import type { Tool } from "@inngest/agent-kit"

// Create a dummy Inngest instance for testing
const testInngest = new Inngest({ id: "test-app" })

// Mock dependencies - Removed unused mockLogger definition
// const mockLogger: HandlerLogger = {
//   ...centralMockLogger,
//   log: mock(() => {}),
// } as unknown as HandlerLogger

// Removed unused agentCreationProps
// const agentCreationProps = {
//   instructions: "mock teamlead instructions",
// }

// Removed unused baseMockDependencies definition
// const baseMockDependencies: Omit<AgentDependencies, "agents" | "instructions"> =
//   { ... }

// --- Test Inngest Function Wrapper --- //
const teamLeadTestFunction = testInngest.createFunction(
  { id: "test-teamlead-fn", name: "Test TeamLead Agent Logic" },
  { event: "test/teamlead.run" },
  async ({ step }: { event: any; step: any }) => {
    const requirements = await step.run("generate-requirements", async () => {
      // This internal agent call won't actually happen if the step is mocked
      return "Placeholder for agent logic if step wasn't mocked"
    })

    return requirements
  }
)
// --- --- //

describe("Agent Definitions: TeamLead Agent", () => {
  let mockDeps: AgentDependencies
  let teamLeadInstructions: string
  let baseDeps: AgentDependencies
  let toolsForTest: Tool<any>[]

  beforeEach(() => {
    // setupTestEnvironmentFocused() called by global hook
    baseDeps = createBaseMockDependencies() // Now returns AgentDependencies
    teamLeadInstructions = "мудрый Руководитель Команды (TeamLead)" // Updated instructions
    // Define tools typically needed/filtered by TeamLead
    toolsForTest = getMockTools(["updateTaskState", "web_search"])
    // Combine base deps with tools and agents - No need to re-add log, model etc.
    // mockDeps is now the full AgentDependencies object
    mockDeps = {
      ...baseDeps,
      log: mockLogger, // Add mockLogger
      kv: mockKv, // Add mockKv
      model: mockDeepseekModelAdapter, // Add mock model
      systemEvents: mockSystemEvents, // Add systemEvents
      allTools: toolsForTest,
      agents: {}, // Add empty agents object
    }
  })

  it("should create a TeamLead agent with correct basic properties", () => {
    // Pass the combined mockDeps and instructions
    const agent = createTeamLeadAgent(mockDeps, teamLeadInstructions)

    expect(agent.name).toBe("TeamLead") // Updated expected name
    expect(agent.description).toBeDefined()
    // Check system prompt separately
    // expect(agent.system).toBe(agentCreationProps.instructions)
  })

  // Skip this test due to @inngest/test internalEvents error
  it.skip("should generate requirements using InngestTestEngine", async () => {
    const engine = new InngestTestEngine({ function: teamLeadTestFunction })

    const mockRequirements = "* Requirement 1\n* Requirement 2"
    const inputTask = "Create a simple function"

    const { result } = await engine.execute({
      events: [{ name: "test/teamlead.run", data: { task: inputTask } }],
      steps: [
        {
          id: "generate-requirements",
          handler: () => mockRequirements,
        },
      ],
    })

    // Assert the final result of the Inngest function
    expect(result).toEqual(mockRequirements)
  })

  // Added dedicated test for system prompt
  it("should generate a system prompt containing core instructions", () => {
    // Pass the combined mockDeps and instructions
    const agent = createTeamLeadAgent(mockDeps, teamLeadInstructions)
    const systemPrompt = agent.system
    expect(systemPrompt).toBeDefined()
    expect(systemPrompt).toBe(teamLeadInstructions) // Check full prompt
    expect(systemPrompt).toContain("Руководитель Команды") // Check specific content
  })

  it("should correctly filter tools", () => {
    // Pass the combined mockDeps and instructions
    const agent = createTeamLeadAgent(mockDeps, teamLeadInstructions)
    // TeamLead requires 'updateTaskState' and 'web_search'
    expect(agent.tools.size).toBe(2) // Use .size for Map
    expect(agent.tools.has("updateTaskState")).toBe(true) // Use .has for Map
    expect(agent.tools.has("web_search")).toBe(true)
    expect(agent.tools.has("readFile")).toBe(false)
  })
})
