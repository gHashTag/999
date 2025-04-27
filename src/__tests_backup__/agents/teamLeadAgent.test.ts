import { InngestTestEngine } from "@inngest/test"
import { createTeamLeadAgent } from "@/agents/teamlead/logic/createTeamLeadAgent" // Adjust path if needed
import { vi, describe, it, expect, beforeEach } from "vitest"
import {
  type AgentDependencies,
  type HandlerLogger,
  type AgentCreationProps,
} from "@/types/agents"
import { EventEmitter } from "events"
import { Inngest } from "inngest"

// Create a dummy Inngest instance for testing
const testInngest = new Inngest({ id: "test-app" })

// Mock dependencies
const mockLogger: HandlerLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  log: vi.fn(),
}

// Define props needed for agent creation
const agentCreationProps: AgentCreationProps = {
  instructions: "mock teamlead instructions",
}

// Base dependencies without instructions
const baseMockDependencies: Omit<AgentDependencies, "agents"> = {
  apiKey: "test-key",
  modelName: "test-model",
  allTools: [], // Add mock tools if needed for specific tests
  log: mockLogger,
  systemEvents: new EventEmitter(),
  sandbox: null, // Mock sandbox if needed
  eventId: "test-event-id",
}

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
  beforeEach(() => {
    // Reset mocks if necessary
    vi.clearAllMocks()
  })

  it("should create a TeamLead agent with correct basic properties", () => {
    const agent = createTeamLeadAgent({
      ...baseMockDependencies,
      ...agentCreationProps,
    })

    expect(agent.name).toBe("TeamLead Agent") // Verify name
    expect(agent.description).toBeDefined()
    expect(agent.system).toBe(agentCreationProps.instructions)
    // Add more assertions for model, tools etc. if needed
  })

  // Test the agent logic using the wrapper function and InngestTestEngine
  it("should generate requirements using InngestTestEngine", async () => {
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
})
