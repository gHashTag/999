// src/tools/definitions/__tests__/updateTaskStateTool.test.ts
import { describe, it, expect, beforeEach, Mock } from "bun:test"
import {
  createFullMockDependencies,
  mockLoggerInstance,
  mockEventId,
  setupTestEnvironment,
  mockInfo,
  mockError,
  createMockKvStore,
} from "../setup/testSetup"
import { createUpdateTaskStateTool } from "@/tools/definitions/updateTaskStateTool"
import { TddNetworkState, NetworkStatus } from "@/types/network"
import type { AgentDependencies, KvStore } from "@/types/agents"
import { updateTaskStateParamsSchema } from "@/tools/schemas"
import { z } from "zod"

// Infer the parameters type from the Zod schema
type UpdateTaskStateParams = z.infer<typeof updateTaskStateParamsSchema>

describe("Update Task State Tool Unit Tests", () => {
  let deps: AgentDependencies
  let eventId: string
  let testKv: KvStore

  beforeEach(() => {
    setupTestEnvironment()
    eventId = mockEventId
    testKv = createMockKvStore()
    deps = createFullMockDependencies({ log: mockLoggerInstance, kv: testKv })
  })

  it("should create the tool with correct name and description", () => {
    const tool = createUpdateTaskStateTool(deps.log, testKv, eventId)
    expect(tool).toBeDefined()
    expect(tool.name).toBe("updateTaskState")
    expect(tool.description).toBeDefined()
  })

  it("should update the status in KV store successfully", async () => {
    const tool = createUpdateTaskStateTool(deps.log, testKv, eventId)
    const params: UpdateTaskStateParams = {
      updates: { status: NetworkStatus.Enum.COMPLETED },
    }
    const kvSetMock = testKv.set as Mock<any>
    kvSetMock.mockClear()
    const result = await tool.handler(params, {} as any)

    expect(result).toEqual({ success: true })
    expect(kvSetMock).toHaveBeenCalledTimes(1)
    expect(kvSetMock).toHaveBeenCalledWith(
      "status",
      NetworkStatus.Enum.COMPLETED
    )
    expect(mockInfo).toHaveBeenCalled()
  })

  it("should merge multiple updates into KV store state", async () => {
    const initialKvState: Partial<TddNetworkState> = {
      status: NetworkStatus.Enum.NEEDS_CODE,
      test_code: "initial test code",
    }
    for (const [key, value] of Object.entries(initialKvState)) {
      await testKv.set(key, value)
    }
    const kvSetMock = testKv.set as Mock<any>
    kvSetMock.mockClear()

    const tool = createUpdateTaskStateTool(deps.log, testKv, eventId)
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
    expect(kvSetMock).toHaveBeenCalledTimes(expectedHandlerCalls)
    expect(kvSetMock).toHaveBeenCalledWith(
      "status",
      NetworkStatus.Enum.NEEDS_IMPLEMENTATION_CRITIQUE
    )
    expect(kvSetMock).toHaveBeenCalledWith("implementation_code", "new code")
    expect(kvSetMock).toHaveBeenCalledWith("critique", "")

    const finalState = await testKv.all?.()
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

    expect(mockInfo).toHaveBeenCalled()
  })

  it("should handle missing KV store gracefully", async () => {
    const depsWithoutKv = createFullMockDependencies({
      kv: undefined,
      log: mockLoggerInstance,
    })
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
    expect(mockError).toHaveBeenCalledWith(
      "KV store not available",
      expect.objectContaining({ step: "TOOL_UPDATE_STATE_ERROR" })
    )
  })

  it("should handle errors during KV set operation", async () => {
    const setError = new Error("KV Set Failed")
    const kvSetMock = testKv.set as Mock<any>
    const originalSet = kvSetMock.getMockImplementation()
    kvSetMock.mockClear()
    kvSetMock.mockRejectedValue(setError)

    const tool = createUpdateTaskStateTool(deps.log, testKv, eventId)
    const params: UpdateTaskStateParams = {
      updates: { status: NetworkStatus.Enum.FAILED },
    }
    const result = await tool.handler(params, {} as any)

    expect(result).toEqual({
      success: false,
      error: `KV set failed: ${setError.message}`,
    })
    expect(kvSetMock).toHaveBeenCalledWith("status", NetworkStatus.Enum.FAILED)
    expect(kvSetMock).toHaveBeenCalledTimes(1)

    expect(mockError).toHaveBeenCalledWith(
      `KV set failed: ${setError.message}`,
      expect.objectContaining({
        step: "TOOL_UPDATE_STATE_ERROR",
        error: setError.message,
      })
    )

    if (originalSet) kvSetMock.mockImplementation(originalSet)
  })

  it("should log start and end messages", async () => {
    const tool = createUpdateTaskStateTool(deps.log, testKv, eventId)
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
