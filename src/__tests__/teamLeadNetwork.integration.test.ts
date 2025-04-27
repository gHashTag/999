// import { type Mock } from "vitest" // Import Mock directly
import {
  // describe,
  // it,
  // expect,
  // vi,
  // beforeEach,
  // createMockNetworkState,
  // createBaseMockDependencies,
  mockDeepseekModel,
  // afterEach,
  // findToolMock,
  // getMockTools,
  // realDeepseekModelAdapter,
} from "./testSetupFocused"
// REMOVED: Unused import
// import { createDevOpsNetwork } from "@/network/network"
// REMOVED: Unused import
// import { TddNetworkState, NetworkStatus } from "@/types/network"
import { createAgent } from "@inngest/agent-kit" // Keep createAgent for mocks
// REMOVED: Unused import
// import type {
//   AgentDependencies,
//   HandlerLogger,
// } from "@/types/agents"
// REMOVED: Unused import
// import { createUpdateTaskStateTool } from "@/tools/definitions/updateTaskStateTool"
// Import the REAL function we want to spy on
// REMOVED: Unused import
// import { createTeamLeadAgent } from "@/agents/teamlead/logic/createTeamLeadAgent"
// REMOVED: Unused import
// import { Message } from "@inngest/agent-kit"

// --- REMOVED --- Copied AGENT_TeamLead instructions --- //

// Need mock model for creating mock agents - Already imported via testSetupFocused

// REMOVE THESE UNUSED MOCKS
// // Mocks for other agents (using createAgent)
// // Corrected: createAgent takes name and model, optional system prompt
// const mockTesterAgent = createAgent({
//   name: "TesterAgent",
//   // id: "mock-tester", // ID is not a valid parameter
//   model: mockDeepseekModel,
//   system: "-", // Use system instead of instructions
// })
// const mockCoderAgent = createAgent({
//   name: "CoderAgent",
//   // id: "mock-coder", // ID is not a valid parameter
//   model: mockDeepseekModel,
//   system: "-", // Use system instead of instructions
// })
// const mockCriticAgent = createAgent({
//   name: "CriticAgent",
//   // id: "mock-critic", // ID is not a valid parameter
//   model: mockDeepseekModel,
//   system: "-", // Use system instead of instructions
// })
// const mockToolingAgent = createAgent({
//   name: "ToolingAgent",
//   // id: "mock-tooling", // ID is not a valid parameter
//   model: mockDeepseekModel,
//   system: "-", // Use system instead of instructions
// })

// describe("Focused Integration Test: REAL TeamLead Agent (run mocked) in Network", () => {
//   let network: Network<TddNetworkState>
//   let initialState: TddNetworkState
//   let updateTaskStateTool: Tool<any> // Keep the REAL tool
//   let realTeamLeadAgent: Agent<any> // Changed variable name
//   let mockUpdateStateTool: Tool<any>
//   let initialMockState: TddNetworkState

//   const initialTask = "Write a simple function"

//   beforeEach(async () => {
//     vi.resetAllMocks()

//     const mockLoggerForTool: HandlerLogger = {
//       info: vi.fn(),
//       warn: vi.fn(),
//       error: vi.fn(),
//       debug: vi.fn(),
//       log: vi.fn(),
//     }
//     updateTaskStateTool = createUpdateTaskStateTool(
//       mockLoggerForTool,
//       "test-event-id"
//     )

//     initialState = createMockNetworkState({
//       task: "Test task for REAL TeamLead (run mocked)",
//     })
//     // Base deps without model
//     // let baseDeps: Omit<AgentDependencies, "allTools" | "agents" | "model"> // Omit model

//     // --- Create REAL TeamLead Agent --- //
//     const baseDeps = createBaseMockDependencies()
//     // Get the specific tools needed by the real createTeamLeadAgent
//     const requiredTools = getMockTools(["updateTaskState", "web_search"])
//     realTeamLeadAgent = createTeamLeadAgent({
//       ...baseDeps,
//       // Instructions can be mocked or use real ones if available
//       instructions: "Mock instructions for real agent test",
//       allTools: requiredTools, // Pass only the tools it needs
//       agents: {}, // Provide empty agents object if needed by constructor
//     })

//     // Spy on the run method of the REAL agent instance
//     vi.spyOn(realTeamLeadAgent, "run")

//     // Create network - pass the REAL agent instance
//     network = createDevOpsNetwork(
//       realTeamLeadAgent, // Pass the REAL agent instance
//       mockTesterAgent, // Keep other agents mocked for isolation
//       mockCoderAgent,
//       mockCriticAgent,
//       mockToolingAgent,
//       mockDeepseekModel // Network default model
//     )

//     network.state.kv.set("network_state", initialState)

//     // Spy on the REAL tool's handler
//     vi.spyOn(updateTaskStateTool, "handler")

//     // --- Create Mocks for Tools (if needed by mock agent's run) --- //
//     // const mockTools = getMockTools(["updateTaskState", "web_search"]) // Keep if mock implementation needs them
//     mockUpdateStateTool = findToolMock("updateTaskState")

//     // Ensure the mock handler is set up correctly (if mock agent calls it)
//     if (mockUpdateStateTool && mockUpdateStateTool.handler) {
//       ;(mockUpdateStateTool.handler as Mock).mockResolvedValue({
//         output: [] as any[],
//       })
//     } else {
//       console.error("Mock updateTaskStateTool or its handler is undefined!")
//     }
//   })

//   it("should call the REAL TeamLead agent (run mocked), which then calls updateTaskState tool", async () => {
//     // Configure the REAL agent's run implementation using the spy
//     ;(realTeamLeadAgent.run as Mock).mockImplementation(
//       async (_input: string, opts?: any): Promise<any> => {
//         const generatedRequirements =
//           "* Req 1 (Mock Agent)\n* Req 2 (Mock Agent)"
//         // Simulate the agent calling the updateTaskState tool handler
//         if (updateTaskStateTool?.handler) {
//           await updateTaskStateTool.handler(
//             {
//               newStatus: NetworkStatus.Enum.NEEDS_REQUIREMENTS_CRITIQUE,
//               test_requirements: generatedRequirements,
//             },
//             // Pass the REAL agent instance here
//             {
//               agent: realTeamLeadAgent as any,
//               network: opts?.network,
//               step: opts?.step,
//             }
//           )
//         }
//         // Return structure matching AgentResult/Message
//         return {
//           output: [
//             { type: "text", role: "assistant", content: generatedRequirements },
//           ] as Message[],
//           toolCalls: [], // Tool call simulated above
//         }
//       }
//     )

//     // Run the network
//     await network.run(initialState.task)

//     // Check that the REAL agent.run was called
//     expect(realTeamLeadAgent.run).toHaveBeenCalledTimes(1)
//     expect(realTeamLeadAgent.run).toHaveBeenCalledWith(
//       initialState.task,
//       expect.anything() // Check that opts are passed
//     )

//     // Check if the REAL TOOL HANDLER was called by the mock implementation
//     expect(updateTaskStateTool.handler).toHaveBeenCalledTimes(1)
//     expect(updateTaskStateTool.handler).toHaveBeenCalledWith(
//       expect.objectContaining({
//         newStatus: NetworkStatus.Enum.NEEDS_REQUIREMENTS_CRITIQUE,
//         // Мы не можем проверить test_requirements, так как реальный run не мокирован
//         // test_requirements: expect.stringContaining("Req 1 (Mock Agent)"),
//       }),
//       // Ensure the handler was called with the context of the REAL agent
//       expect.objectContaining({
//         agent: realTeamLeadAgent as any, // <-- Оставить эту проверку
//         network: network,
//       })
//     )

//     // Check the final state
//     const finalState = network.state.kv.get("network_state") as TddNetworkState
//     expect(finalState).toBeDefined() // <-- Оставить эту проверку
//     expect(finalState.status).toEqual(
//       // <-- Оставить эту проверку
//       NetworkStatus.Enum.NEEDS_REQUIREMENTS_CRITIQUE
//     )
//     expect(finalState.test_requirements).toContain("Req 1 (Mock Agent)") // <-- Раскомментировать
//   })
// })
