// src/tools/definitions/__tests__/updateTaskStateTool.test.ts
import { describe, it, expect, vi } from "vitest"
import { createUpdateTaskStateTool } from "@/tools/definitions/updateTaskStateTool"
import { NetworkStatus, type TddNetworkState } from "@/types/network"
import type { HandlerLogger } from "@/types/agents"

// Mock the HandlerLogger
const mockLog: HandlerLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  log: vi.fn(),
}

// Helper to create a basic mock KV store (get/set only)
const createSimpleMockKv = (initialState: TddNetworkState | undefined) => ({
  get: vi.fn().mockReturnValue(initialState),
  set: vi.fn(),
  // Remove delete, has, all for simplification
})

describe("createUpdateTaskStateTool", () => {
  const eventId = "test-event-123"

  it("should create a tool with the correct name and description", () => {
    const tool = createUpdateTaskStateTool(mockLog, eventId)
    expect(tool.name).toBe("update_task_state")
    expect(tool.description).toContain("Updates the current state")
    expect(tool.parameters).toBeDefined()
  })

  it("should update the status in the KV store", async () => {
    const tool = createUpdateTaskStateTool(mockLog, eventId)
    const initialState: TddNetworkState = {
      task: "initial task",
      status: NetworkStatus.Enum.NEEDS_REQUIREMENTS_CRITIQUE,
      sandboxId: "sandbox-1",
    }
    const mockKv = createSimpleMockKv(initialState)
    const mockOpts: any = {
      network: {
        state: { kv: mockKv },
        agent: { id: "mockAgent" },
      },
    }

    const params = { newStatus: NetworkStatus.Enum.NEEDS_TEST }
    await tool.handler(params, mockOpts)

    expect(mockKv.set).toHaveBeenCalledTimes(1)
    const finalState = mockKv.set.mock.calls[0][1] as TddNetworkState
    expect(finalState.status).toBe(NetworkStatus.Enum.NEEDS_TEST)
    expect(finalState.task).toBe("initial task")
    expect(mockLog.info).toHaveBeenCalledWith(
      expect.objectContaining({ step: "TOOL_UPDATE_STATE_SUCCESS" }),
      expect.stringContaining("Network state updated successfully"),
      expect.anything()
    )
  })

  it("should update status and other provided fields", async () => {
    const tool = createUpdateTaskStateTool(mockLog, eventId)
    const initialTask = "task two"
    const initialRequirements = "Initial requirements"
    const initialState: TddNetworkState = {
      task: initialTask,
      status: NetworkStatus.Enum.IDLE,
      test_requirements: initialRequirements,
      sandboxId: "sandbox-2",
    }
    const mockKv = createSimpleMockKv(initialState)
    const newRequirements = "Generated requirements"

    await tool.handler(
      {
        newStatus: NetworkStatus.Enum.NEEDS_TEST,
        test_requirements: newRequirements,
      },
      { network: { state: { kv: mockKv } } }
    )

    expect(mockKv.set).toHaveBeenCalledTimes(1)
    const finalState = mockKv.set.mock.calls[0][1] as TddNetworkState
    expect(finalState.status).toBe(NetworkStatus.Enum.NEEDS_TEST)
    expect(finalState.test_requirements).toBe(newRequirements)
    expect(finalState.task).toBe(initialTask)
  })

  it("should handle missing initial state defensively", async () => {
    const tool = createUpdateTaskStateTool(mockLog, eventId)
    const mockKv = createSimpleMockKv(undefined)
    const mockOpts: any = {
      network: { state: { kv: mockKv }, agent: { id: "mockAgent" } },
    }

    const params = {
      newStatus: NetworkStatus.Enum.NEEDS_IMPLEMENTATION_REVISION,
    }
    await tool.handler(params, mockOpts)

    expect(mockKv.set).toHaveBeenCalledTimes(1)
    const finalState = mockKv.set.mock.calls[0][1] as TddNetworkState
    expect(finalState.status).toBe(
      NetworkStatus.Enum.NEEDS_IMPLEMENTATION_REVISION
    )
    expect(finalState.task).toContain("unknown - state missing before update")
    expect(mockLog.warn).toHaveBeenCalledTimes(1)
    expect(mockLog.warn).toHaveBeenCalledWith(
      expect.objectContaining({ step: "TOOL_UPDATE_STATE_WARN" }),
      "Initial state was missing in KV store when trying to update.",
      { eventId, updateData: params }
    )
  })

  it("should throw error if KV store is not available", async () => {
    const tool = createUpdateTaskStateTool(mockLog, eventId)
    const mockOpts: any = {
      network: { state: { kv: undefined }, agent: { id: "mockAgent" } },
    }

    const params = { newStatus: NetworkStatus.Enum.COMPLETED }
    await expect(tool.handler(params, mockOpts)).rejects.toThrow(
      "Network state KV store is not available"
    )
    expect(mockLog.error).toHaveBeenCalledWith(
      expect.objectContaining({ step: "TOOL_UPDATE_STATE_ERROR" }),
      expect.stringContaining("KV store is not available"),
      expect.anything()
    )
  })

  // TODO: Add tests for field clearing logic when implemented
})
