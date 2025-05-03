// src/tools/definitions/__tests__/updateTaskStateTool.test.ts
import { describe, it, expect, beforeEach } from "bun:test"
import {
  createFullMockDependencies,
  mockLogger,
  mockUpdateTaskStateHandler,
  mockKvSet,
  mockInfo,
} from "../setup/testSetupFocused"
import { createUpdateTaskStateTool } from "@/tools/definitions/updateTaskStateTool"
import { TddNetworkState, NetworkStatus } from "@/types/network"
import type { AgentDependencies } from "@/types/agents"
import { updateTaskStateParamsSchema } from "@/tools/schemas"
import { z } from "zod"

// Infer the parameters type from the Zod schema
type UpdateTaskStateParams = z.infer<typeof updateTaskStateParamsSchema>

describe("Update Task State Tool Unit Tests", () => {
  let deps: AgentDependencies
  const eventId = "test-event-for-tool"

  beforeEach(() => {
    deps = createFullMockDependencies()
    mockUpdateTaskStateHandler.mockClear()
    Object.keys(mockKvStoreData).forEach(key => delete mockKvStoreData[key])
  })

  it("should create the tool with correct name and description", () => {
    const tool = createUpdateTaskStateTool(deps.log, deps.kv, eventId)
    expect(tool).toBeDefined()
    expect(tool.name).toBe("updateTaskState")
    expect(tool.description).toBeDefined()
  })

  it("should update the status in KV store successfully", async () => {
    const tool = createUpdateTaskStateTool(deps.log, deps.kv, eventId)
    const params: UpdateTaskStateParams = {
      updates: { status: NetworkStatus.Enum.COMPLETED },
    }
    mockKvSet.mockClear()
    const result = await tool.handler(params, {} as any)

    expect(result).toEqual({ success: true })
    expect(mockKvSet).toHaveBeenCalledTimes(1)
    expect(mockKvSet).toHaveBeenCalledWith(
      "status",
      NetworkStatus.Enum.COMPLETED
    )
    expect(mockLogger.info).toHaveBeenCalled()
  })

  it("should merge multiple updates into KV store state", async () => {
    const initialKvState: Partial<TddNetworkState> = {
      status: NetworkStatus.Enum.NEEDS_CODE,
      test_code: "initial test code",
    }
    if (deps.kv) {
      for (const [key, value] of Object.entries(initialKvState)) {
        await deps.kv.set(key, value)
      }
    }
    mockKvSet.mockClear()

    const tool = createUpdateTaskStateTool(deps.log, deps.kv, eventId)
    const params: UpdateTaskStateParams = {
      updates: {
        status: NetworkStatus.Enum.NEEDS_IMPLEMENTATION_CRITIQUE,
        implementation_code: "new code",
        critique: "",
      },
    }
    const result = await tool.handler(params, {} as any)

    expect(result).toEqual({ success: true })
    const expectedHandlerCalls = Object.keys(params.updates).length
    expect(mockKvSet).toHaveBeenCalledTimes(expectedHandlerCalls)
    expect(mockKvSet).toHaveBeenCalledWith(
      "status",
      NetworkStatus.Enum.NEEDS_IMPLEMENTATION_CRITIQUE
    )
    expect(mockKvSet).toHaveBeenCalledWith("implementation_code", "new code")
    expect(mockKvSet).toHaveBeenCalledWith("critique", "")

    let finalState: Record<string, unknown> | undefined
    if (deps.kv?.all) {
      finalState = await deps.kv.all()
    }
    const expectedEndState: Partial<TddNetworkState> = {
      ...initialKvState,
      ...params.updates,
    }
    expect(finalState).toBeDefined()
    if (finalState) {
      for (const key in expectedEndState) {
        expect((finalState as any)[key]).toEqual((expectedEndState as any)[key])
      }
      expect(Object.keys(finalState).sort()).toEqual(
        Object.keys(expectedEndState).sort()
      )
    }

    expect(mockLogger.info).toHaveBeenCalled()
  })

  it("should handle missing KV store gracefully", async () => {
    mockKvSet.mockClear()

    const depsWithoutKv = createFullMockDependencies({ kv: undefined })
    const tool = createUpdateTaskStateTool(
      depsWithoutKv.log,
      undefined,
      eventId
    )
    const params: UpdateTaskStateParams = {
      updates: { status: NetworkStatus.Enum.FAILED },
    }
    const result = await tool.handler(params, {} as any)

    expect(result).toEqual({ success: false, error: "KV store not available" })
    expect(mockKvSet).not.toHaveBeenCalled()
    expect(mockLogger.error).toHaveBeenCalledWith(
      "KV store not available",
      expect.objectContaining({ step: "TOOL_UPDATE_STATE_ERROR" })
    )
  })

  it("should handle errors during KV set operation", async () => {
    const setError = new Error("KV Set Failed")
    const originalSet = mockKvSet
    mockKvSet.mockClear()
    mockKvSet.mockRejectedValue(setError)

    const tool = createUpdateTaskStateTool(deps.log, deps.kv, eventId)
    const params: UpdateTaskStateParams = {
      updates: { status: NetworkStatus.Enum.FAILED },
    }
    const result = await tool.handler(params, {} as any)

    expect(result).toEqual({
      success: false,
      error: `KV set failed: ${setError.message}`,
    })
    expect(mockKvSet).toHaveBeenCalledWith("status", NetworkStatus.Enum.FAILED)
    expect(mockKvSet).toHaveBeenCalledTimes(1)

    expect(mockLogger.error).toHaveBeenCalledWith(
      `KV set failed: ${setError.message}`,
      expect.objectContaining({
        step: "TOOL_UPDATE_STATE_ERROR",
        error: setError.message,
      })
    )

    mockKvSet.mockImplementation(originalSet)
  })

  it("should log start and end messages", async () => {
    const tool = createUpdateTaskStateTool(deps.log, deps.kv, eventId)
    const params: UpdateTaskStateParams = {
      updates: { task_description: "new task" },
    }
    mockInfo.mockClear()
    await tool.handler(params, {} as any)

    expect(mockInfo).toHaveBeenCalledWith(
      "Attempting to update network state.",
      expect.objectContaining({ step: "TOOL_UPDATE_STATE_START" })
    )
    expect(mockInfo).toHaveBeenCalledTimes(1)
  })
})

import { mockKvStoreData } from "../setup/testSetupFocused"
