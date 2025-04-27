import { describe, it, expect, vi, beforeEach } from "vitest"
import { createCriticAgent } from "@/agents/critic/logic/createCriticAgent"
import type { AgentDependencies, HandlerLogger } from "@/types/agents"
import type { Tool } from "@inngest/agent-kit"
import { NetworkStatus } from "@/types/network"
import { EventEmitter } from "events"

// Mock logger
const mockLogger: HandlerLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  log: vi.fn(),
}

// Mock base dependencies (can be adjusted per test)
const baseDependencies: Omit<AgentDependencies, "instructions"> = {
  apiKey: "test-key",
  modelName: "test-critic-model",
  log: mockLogger,
  allTools: [] as Tool<any>[],
  eventId: "mock-event-id",
  systemEvents: new EventEmitter(),
  sandbox: null,
}

describe("createCriticAgent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should create an agent with the correct name and description", () => {
    const agent = createCriticAgent({
      ...baseDependencies,
      instructions: "mock critic instructions",
    })
    expect(agent.name).toBe("Critic Agent")
    expect(agent.description).toContain("Оценивает код и тесты")
  })

  it("should use the provided model configuration", () => {
    const agent = createCriticAgent({
      ...baseDependencies,
      instructions: "mock critic instructions",
    })
    // Access internal properties carefully for testing
    const modelConfig = (agent as any).model?.config // Access config object
    expect(modelConfig?.apiKey).toBe("test-key")
    expect(modelConfig?.model).toBe("test-critic-model")
  })

  it("should filter tools correctly (Critic needs web_search)", () => {
    // Define mock tools *for this test*
    const mockRunCommandTool: Tool<any> = {
      name: "runCommand",
      handler: vi.fn(),
    }
    const mockReadFileTool: Tool<any> = { name: "readFile", handler: vi.fn() }
    const mockWebSearchTool: Tool<any> = {
      name: "web_search",
      handler: vi.fn(),
    }
    const depsWithTools = {
      ...baseDependencies,
      allTools: [mockRunCommandTool, mockReadFileTool, mockWebSearchTool],
    }
    const agent = createCriticAgent({
      ...depsWithTools,
      instructions: "mock critic instructions",
    })
    // @ts-expect-error - Accessing internal property
    const agentTools = agent.tools as Tool<any>[]
    expect(agentTools.some(t => t.name === "runCommand")).toBe(false)
    expect(agentTools.some(t => t.name === "readFile")).toBe(false)
    expect(agentTools.some(t => t.name === "web_search")).toBe(true)
  })

  it("should create Critic Agent with correct structure and filtered tools", () => {
    const agent = createCriticAgent({
      ...baseDependencies,
      instructions: "mock critic instructions",
    })
    expect(agent.tools.has("updateTaskState")).toBe(true)
    expect(agent.tools.has("readFile")).toBe(true)
    expect(agent.tools.has("askHumanForInput")).toBe(false)
    expect(agent.tools.has("runCommand")).toBe(false)
  })

  it("should generate a system prompt for Critic Agent", async () => {
    const agent = createCriticAgent({
      ...baseDependencies,
      instructions: "mock critic instructions",
    })
    const mockState: Partial<any> = {
      status: NetworkStatus.Enum.NEEDS_TEST_CRITIQUE,
    }
    const mockCtx = {
      network: {
        state: {
          kv: {
            get: vi
              .fn<(key: string) => Partial<any> | undefined>()
              .mockReturnValue(mockState),
            set: vi.fn(),
          },
        },
      },
    }
    let systemPrompt = ""
    if (typeof agent.system === "function") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      systemPrompt = await agent.system(mockCtx as any)
    } else if (typeof agent.system === "string") {
      systemPrompt = agent.system
    }
    expect(systemPrompt).toBeDefined()
    expect(typeof systemPrompt).toBe("string")
    expect(systemPrompt).toContain("Агент-Критик")
    expect(mockCtx.network?.state.kv.get).toHaveBeenCalledWith("network_state")
  })

  // TODO: Add tests for system prompt generation based on state
  // TODO: Add simplified tests for CriticAgent_onFinish (logging only)
})
