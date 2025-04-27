/*
vi.mock("@/agents/teamlead/logic/createTeamLeadAgent")

import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
    mockDeepseekModel,
    createMockNetworkState,
    findToolMock,
    createBaseMockDependencies,
} from "./testSetup"
import { createDevOpsNetwork } from "@/network/network"
import { TddNetworkState, NetworkStatus } from "@/types/network"
import {
    Agent,
    Network,
    type Tool,
    type ToolOptions,
    type AgentRunResult,
} from "@inngest/agent-kit"
import type { AgentDependencies } from "@/types/agents"
import { createUpdateTaskStateTool } from "@/tools/definitions/updateTaskStateTool"
import { createTeamLeadAgent } from "@/agents/teamlead/logic/createTeamLeadAgent"

const mockTesterAgent = { name: "TesterAgent" } as Agent<any>
const mockCoderAgent = { name: "CoderAgent" } as Agent<any>
const mockCriticAgent = { name: "CriticAgent" } as Agent<any>
const mockToolingAgent = { name: "ToolingAgent" } as Agent<any>

describe("Integration Test: MOCKED TeamLead in Network (Final Approach)", () => {
    let network: Network<TddNetworkState>
    let initialState: TddNetworkState
    let updateTaskStateTool: Tool<any>
    let mockWebSearchTool: Tool<any>
    let baseDeps: Omit<AgentDependencies, "allTools" | "agents" | "model">
    let mockTeamLeadAgent: { name: string; run: ReturnType<typeof vi.fn> }

    beforeEach(async () => {
        vi.resetAllMocks()

        const mockLoggerForTool = {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
        }
        updateTaskStateTool = createUpdateTaskStateTool(
            mockLoggerForTool,
            "test-event-id"
        )
        mockWebSearchTool = findToolMock("web_search")

        initialState = createMockNetworkState({
            task: "Test task for MOCKED TeamLead (Final)",
        })
        baseDeps = createBaseMockDependencies()

        mockTeamLeadAgent = {
            name: "Mocked TeamLead Agent",
            run: vi.fn(),
        }
        vi.mocked(createTeamLeadAgent).mockReturnValue(mockTeamLeadAgent as any)

        const network = createDevOpsNetwork(
            mockTeamLeadAgent as any,
            mockTesterAgent,
            mockCoderAgent,
            mockCriticAgent,
            mockToolingAgent
        )

        network.dependencies = {
            ...baseDeps,
            allTools: [updateTaskStateTool, mockWebSearchTool],
            agents: {
                teamLead: mockTeamLeadAgent as any,
                tester: mockTesterAgent,
                coder: mockCoderAgent,
                critic: mockCriticAgent,
                tooling: mockToolingAgent,
            },
            instructions: "placeholder",
        }

        network.state.kv.set("network_state", initialState)

        vi.spyOn(updateTaskStateTool, "handler")
    })

    it("should call the MOCKED TeamLead agent, which then calls updateTaskState tool", async () => {
        mockTeamLeadAgent.run.mockImplementation(
            async (
                input: string,
                opts?: ToolOptions<TddNetworkState>
            ): Promise<AgentRunResult> => {
                const generatedRequirements =
                    "* Req 1 (Mock Agent)\n* Req 2 (Mock Agent)"
                if (updateTaskStateTool?.handler) {
                    await updateTaskStateTool.handler(
                        {
                            newStatus: NetworkStatus.Enum.NEEDS_REQUIREMENTS_CRITIQUE,
                            test_requirements: generatedRequirements,
                        },
                        {
                            agent: mockTeamLeadAgent as any,
                            network: opts?.network,
                            step: opts?.step,
                        }
                    )
                }
                return {
                    output: [generatedRequirements],
                    toolCalls: [],
                }
            }
        )

        await network.run(initialState.task)

        expect(mockTeamLeadAgent.run).toHaveBeenCalledTimes(1)
        expect(mockTeamLeadAgent.run).toHaveBeenCalledWith(
            initialState.task,
            expect.anything()
        )

        expect(updateTaskStateTool.handler).toHaveBeenCalledTimes(1)
        expect(updateTaskStateTool.handler).toHaveBeenCalledWith(
            expect.objectContaining({
                newStatus: NetworkStatus.Enum.NEEDS_REQUIREMENTS_CRITIQUE,
                test_requirements: expect.stringContaining("Req 1 (Mock Agent)"),
            }),
            expect.objectContaining({
                agent: mockTeamLeadAgent as any,
                network: network,
            })
        )

        const finalState = network.state.kv.get("network_state") as TddNetworkState
        expect(finalState).toBeDefined()
        expect(finalState.status).toEqual(
            NetworkStatus.Enum.NEEDS_REQUIREMENTS_CRITIQUE
        )
    })
})
*/
