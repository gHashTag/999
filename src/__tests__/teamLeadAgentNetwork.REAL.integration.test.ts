/*
import { describe, it, expect, beforeEach, vi } from "./testSetupFocused" // Import common test utils

// We want the REAL createTeamLeadAgent here
import { createDevOpsNetwork } from "@/network/network"
import { createTeamLeadAgent } from "@/agents/teamlead/logic/createTeamLeadAgent"
// import { Agent } from "@inngest/agent-kit"; // Agent type no longer directly needed if we don't assert instance type
import {
  setupTestEnvironmentFocused,
  createBaseMockDependencies,
  getMockTools,
  findToolMock,
  createMockNetworkState,
  createMockAgent,
  mockDeepseekModel, // Import the mock model to configure its request method
} from "./testSetupFocused"
import { NetworkStatus, type TddNetworkState } from "@/types/network"
import type { AgentDependencies } from "@/types/agents"

const TEAMLEAD_INSTRUCTIONS = "Test instructions for REAL TeamLead in network"

describe("Integration Test: REAL TeamLead Agent (Mocked Model Request)", () => {
  beforeEach(() => {
    setupTestEnvironmentFocused()

    // ---- Mock the underlying model's response ----
    const mockLLMResponse = {
      choices: [
        {
          message: {
            role: "assistant",
            content: [
              {
                type: "text",
                text: "Generated requirements by REAL agent (mocked model)",
              },
              {
                type: "tool_calls",
                tool_calls: [
                  {
                    id: "tool_call_model_123",
                    function: {
                      // Note: AgentKit might expect 'function' or 'tool' depending on version/adapter
                      name: "updateTaskState",
                      // Arguments usually need to be a JSON string for LLM calls
                      arguments: JSON.stringify({
                        status: "NEEDS_REQUIREMENTS_CRITIQUE",
                        test_requirements: ["Model Req 1", "Model Req 2"],
                      }),
                    },
                  },
                ],
              },
            ],
          },
          finish_reason: "tool_calls",
        },
      ],
      usage: { total_tokens: 60 },
      // Add other necessary fields if AgentKit model adapter expects them
      id: "mock-completion-id-from-model",
      created: Date.now(),
      model: "mock-model-name-in-response",
    }
    // Configure the mock request method on the imported mock model adapter
    vi.mocked(mockDeepseekModel.request).mockResolvedValue(mockLLMResponse)
    // ---- End Mock ----
  })

  it("should use real TeamLead agent, mock model request, and verify tool call", async () => {
    // 1. Setup Dependencies (includes mock model now)
    const baseDeps: AgentDependencies = {
      ...createBaseMockDependencies(),
      allTools: getMockTools(["updateTaskState", "web_search"]), // Tools available
      agents: {} as any,
    }

    // Create the *real* TeamLead agent - it will receive mockDeepseekModel via baseDeps
    const teamLeadAgent = createTeamLeadAgent({
      ...baseDeps,
      allTools: getMockTools(["updateTaskState"]), // <-- Убираем web_search
      instructions: TEAMLEAD_INSTRUCTIONS,
    })

    // Create the network instance, PASSING the default model
    const network = createDevOpsNetwork(
      teamLeadAgent,
      createMockAgent("tester", "Tester Agent"),
      createMockAgent("coder", "Coder Agent"),
      createMockAgent("critic", "Critic Agent"),
      createMockAgent("tooling", "Tooling Agent"),
      mockDeepseekModel // PASS the mock model as default
    )

    // 2. Initial State
    const initialTask = "Create a simple add function (mocked model)"
    const initialState = createMockNetworkState({
      task: initialTask,
      status: NetworkStatus.Enum.NEEDS_TEST, // Use CORRECT enum value for initial state
    })
    network.state.kv.set("network_state", initialState)

    // 3. Run Network
    await network.run(initialTask)

    // 4. Assertions
    // Verify the mocked model request was called by the agent
    expect(mockDeepseekModel.request).toHaveBeenCalledTimes(1)

    // Check if updateTaskState tool was called by the network's tool execution logic
    const updateTaskStateHandlerMock = findToolMock("updateTaskState").handler
    expect(updateTaskStateHandlerMock).toHaveBeenCalledTimes(1)

    // Check the arguments passed to the tool handler
    const expectedToolArgs = {
      status: "NEEDS_REQUIREMENTS_CRITIQUE",
      test_requirements: ["Model Req 1", "Model Req 2"], // Match args from mocked LLM response
    }
    expect(updateTaskStateHandlerMock).toHaveBeenCalledWith(
      expectedToolArgs,
      expect.objectContaining({ network: expect.anything() })
    )

    // Check the final network state
    const finalState = network.state.kv.get("network_state") as TddNetworkState
    expect(finalState).toBeDefined()
    expect(finalState?.status).toBe("NEEDS_REQUIREMENTS_CRITIQUE")
    expect(finalState?.test_requirements).toEqual([
      "Model Req 1",
      "Model Req 2",
    ])
  })
})
*/
