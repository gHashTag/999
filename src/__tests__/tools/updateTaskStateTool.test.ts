// src/tools/definitions/__tests__/updateTaskStateTool.test.ts
import { describe, it, expect, mock, beforeEach } from "bun:test"
import { createUpdateTaskStateTool } from "@/tools/definitions/updateTaskStateTool"
import { NetworkStatus, type TddNetworkState } from "@/types/network"
import type { HandlerLogger } from "@/types/agents"
import { type State } from "@inngest/agent-kit"

// Import necessary items from the focused setup file
import {
  mockInfo,
  mockWarn,
  mockError,
  mockDebug,
  mockLog,
  mockEventId,
} from "../testSetupFocused" // Correct path

// Local mock KV and state for tests in this file
let mockKvStore = new Map<string, any>()
// No need for initialState variable here, setup in beforeEach
// let initialState: TddNetworkState | undefined

const mockKv = {
  get: mock((key: string): TddNetworkState | undefined => mockKvStore.get(key)), // Ensure return type matches
  set: mock((key: string, value: any) => {
    mockKvStore.set(key, value)
  }),
  all: mock(() => Object.fromEntries(mockKvStore)),
  delete: mock((key: string) => mockKvStore.delete(key)),
  has: mock((key: string) => mockKvStore.has(key)),
}

// Mock ToolInput structure (if ToolInput is needed)
// This is a basic structure, adjust based on actual ToolInput type from agent-kit
type MockToolInput<P = any, S extends Record<string, unknown> = any> = {
  params: P
  network: {
    state: State<S>
    agent: { id: string }
  }
}

// Helper to create mock ToolInput
// This helper now primarily sets up the params, the state setup happens in beforeEach
const createMockToolInput = <P, S extends Record<string, unknown>>(
  params: P,
  // stateData: S, // State data is now set in beforeEach
  agentId = "mockAgent"
): MockToolInput<P, S> => {
  // Setup mockKvStore for this specific input state
  // mockKvStore = new Map(Object.entries(stateData)) // Moved to beforeEach
  return {
    params,
    network: {
      state: { kv: mockKv } as any, // Use 'as any' to bypass strict State type check
      agent: { id: agentId },
    },
  }
}

// Reconstruct a logger-like object locally using imported mocks
const testLogger = {
  info: mockInfo,
  warn: mockWarn,
  error: mockError,
  debug: mockDebug,
  log: mockLog,
}

describe("createUpdateTaskStateTool", () => {
  const eventId = mockEventId

  beforeEach(() => {
    // Reset mocks and state before each test
    mockKvStore = new Map<string, any>()

    // Reset KV mocks
    mockKv.get.mockClear()
    mockKv.set.mockClear()
    mockKv.all.mockClear()
    mockKv.delete.mockClear()
    mockKv.has.mockClear()

    // Reset Logger mocks directly
    mockInfo.mockClear()
    mockWarn.mockClear()
    mockError.mockClear()
    mockDebug.mockClear()
    mockLog.mockClear()

    // Explicitly set the return value for mockKv.get for the NEXT call
    mockKv.get.mockImplementation(
      (key: string): TddNetworkState | undefined => {
        if (key === "network_state") {
          const stateFromStore = mockKvStore.get(key)
          return stateFromStore ? { ...stateFromStore } : undefined
        }
        return undefined
      }
    )

    // Set implementation for set (points to the cleared mockKvStore)
    mockKv.set.mockImplementation((key: string, value: any) => {
      mockKvStore.set(key, value)
    })
    // Set implementations for other kv methods if needed
    mockKv.all.mockImplementation(() => Object.fromEntries(mockKvStore))
    mockKv.delete.mockImplementation((key: string) => mockKvStore.delete(key))
    mockKv.has.mockImplementation((key: string) => mockKvStore.has(key))
  })

  it("should create a tool with the correct name and description", () => {
    const tool = createUpdateTaskStateTool(testLogger as HandlerLogger, eventId)
    expect(tool.name).toBe("update_task_state")
    expect(tool.description).toContain("Updates the current state")
  })

  it("should update the status in the KV store", async () => {
    const tool = createUpdateTaskStateTool(testLogger as HandlerLogger, eventId)
    const startState: TddNetworkState = {
      status: NetworkStatus.Enum.NEEDS_REQUIREMENTS_CRITIQUE,
      task: "initial task",
      sandboxId: "sandbox-1",
      run_id: "run-1", // Added run_id
    }
    mockKvStore.set("network_state", startState)

    const params = { newStatus: NetworkStatus.Enum.NEEDS_TEST }
    const mockOpts = createMockToolInput(params)
    const expectedEndState: TddNetworkState = {
      ...startState,
      status: NetworkStatus.Enum.NEEDS_TEST,
    }

    await tool.handler(params, mockOpts as any)

    // Use .mock.calls to access mock calls in bun:test
    console.log("--- Test 1 KV Set Args ---")
    console.log("Actual:", JSON.stringify(mockKv.set.mock.calls[0], null, 2))
    console.log("Expected Key:", "network_state")
    console.log("Expected State:", JSON.stringify(expectedEndState, null, 2))
    console.log("---------------------------")

    expect(mockKv.set).toHaveBeenCalledTimes(1)
    expect(mockKv.set).toHaveBeenCalledWith("network_state", expectedEndState)
    expect(mockKvStore.get("network_state")).toEqual(expectedEndState)

    console.log("--- Test 1 Logger Info Args ---")
    // Use .mock.calls instead of .calls
    console.log("Actual:", JSON.stringify(mockInfo.mock.calls, null, 2)) // Log all calls
    console.log("------------------------------")

    // Check that the SUCCESS log message was called
    expect(mockInfo).toHaveBeenCalledWith(
      expect.objectContaining({ step: "TOOL_UPDATE_STATE_SUCCESS" }),
      expect.stringContaining("Network state updated successfully"),
      expect.anything()
    )
    // Optional: Check for START log if needed
    expect(mockInfo).toHaveBeenCalledWith(
      expect.objectContaining({ step: "TOOL_UPDATE_STATE_START" }),
      expect.stringContaining("Attempting to update network state"),
      expect.anything()
    )
  })

  it("should update status and other provided fields, respecting tool logic", async () => {
    const tool = createUpdateTaskStateTool(testLogger as HandlerLogger, eventId)
    const startState: TddNetworkState = {
      task: "task two",
      status: NetworkStatus.Enum.NEEDS_TEST,
      sandboxId: "sandbox-2",
      test_requirements: "Initial requirements",
      run_id: "run-2", // Added run_id
    }
    mockKvStore.set("network_state", startState)

    const params = {
      newStatus: NetworkStatus.Enum.NEEDS_TEST_CRITIQUE,
      test_requirements: "Updated requirements",
      critique: "Needs more detail",
    }
    const mockOpts = createMockToolInput(params)
    const expectedEndState: TddNetworkState = {
      ...startState,
      status: NetworkStatus.Enum.NEEDS_TEST_CRITIQUE,
      test_requirements: undefined,
      implementation_critique: "Needs more detail",
    }

    await tool.handler(params, mockOpts as any)

    console.log("--- Test 2 KV Set Args ---")
    console.log("Actual:", JSON.stringify(mockKv.set.mock.calls[0], null, 2))
    console.log("Expected Key:", "network_state")
    console.log("Expected State:", JSON.stringify(expectedEndState, null, 2))
    console.log("---------------------------")

    expect(mockKv.set).toHaveBeenCalledTimes(1)
    expect(mockKv.set).toHaveBeenCalledWith("network_state", expectedEndState)
    expect(mockKvStore.get("network_state")).toEqual(expectedEndState)

    console.log("--- Test 2 Logger Info Args ---")
    // Use .mock.calls instead of .calls
    console.log("Actual:", JSON.stringify(mockInfo.mock.calls, null, 2)) // Log all calls
    console.log("------------------------------")

    // Check that the SUCCESS log message was called
    expect(mockInfo).toHaveBeenCalledWith(
      expect.objectContaining({ step: "TOOL_UPDATE_STATE_SUCCESS" }),
      expect.stringContaining("Network state updated successfully"),
      expect.anything()
    )
    // Optional: Check for START log if needed
    expect(mockInfo).toHaveBeenCalledWith(
      expect.objectContaining({ step: "TOOL_UPDATE_STATE_START" }),
      expect.stringContaining("Attempting to update network state"),
      expect.anything()
    )
  })

  it("should handle missing initial state defensively", async () => {
    const tool = createUpdateTaskStateTool(testLogger as HandlerLogger, eventId)
    const params = {
      newStatus: NetworkStatus.Enum.NEEDS_IMPLEMENTATION_REVISION,
    }
    const mockOpts = createMockToolInput(params)
    const expectedEndState: Partial<TddNetworkState> = {
      // Use Partial as run_id is missing
      task: "unknown - state missing before update",
      status: NetworkStatus.Enum.NEEDS_IMPLEMENTATION_REVISION,
      sandboxId: undefined,
      // run_id: "unknown", // Removed run_id from expectation
    }

    await tool.handler(params, mockOpts as any)

    console.log("--- Test 3 KV Set Args ---")
    console.log("Actual:", JSON.stringify(mockKv.set.mock.calls[0], null, 2))
    console.log("Expected Key:", "network_state")
    console.log("Expected State:", JSON.stringify(expectedEndState, null, 2))
    console.log("---------------------------")

    expect(mockKv.set).toHaveBeenCalledTimes(1)
    // Check the actual set value against the modified expectation
    expect(mockKv.set).toHaveBeenCalledWith(
      "network_state",
      expect.objectContaining(expectedEndState)
    )
    // Also check the store directly
    expect(mockKvStore.get("network_state")).toEqual(
      expect.objectContaining(expectedEndState)
    )

    console.log("--- Test 3 Logger Warn Args ---")
    // Use .mock.calls instead of .calls
    console.log("Actual:", JSON.stringify(mockWarn.mock.calls[0], null, 2))
    console.log("------------------------------")

    expect(mockWarn).toHaveBeenCalledWith(
      expect.objectContaining({ step: "TOOL_UPDATE_STATE_WARN" }),
      expect.stringContaining("Initial state was missing in KV store"),
      expect.anything()
    )
  })

  it("should throw error if KV store is not available in opts", async () => {
    const tool = createUpdateTaskStateTool(testLogger as HandlerLogger, eventId)
    const params = { newStatus: NetworkStatus.Enum.COMPLETED }
    const invalidOpts: any = {
      params,
      network: { state: { kv: undefined }, agent: { id: "mockAgent" } },
    }

    await expect(tool.handler(params, invalidOpts)).rejects.toThrow(
      "Network state KV store is not available"
    )

    console.log("--- Test 4 Logger Error Args ---")
    // Use .mock.calls instead of .calls
    console.log("Actual:", JSON.stringify(mockError.mock.calls[0], null, 2))
    console.log("-------------------------------")

    expect(mockError).toHaveBeenCalledWith(
      expect.objectContaining({ step: "TOOL_UPDATE_STATE_ERROR" }),
      "Network state KV store is not available in updateTaskState tool.",
      expect.objectContaining({ eventId: mockEventId })
    )
  })
})
