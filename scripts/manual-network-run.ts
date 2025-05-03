#!/usr/bin/env bun
import { createState, type Agent, type Tool } from "@inngest/agent-kit"
import { createDevOpsNetwork } from "../src/network/network"
import { TddNetworkState } from "../src/types/network"
import { type AgentDependencies, type BaseLogger } from "../src/types/agents"
import {
  // Import mock tools definitions and the mock adapter factory
  mockUpdateTaskStateTool,
  mockWebSearchTool,
  mockAnalyzeCodeTool,
  mockCodexCliTool,
  createMockDeepseekAdapter,
} from "../src/__tests_focused__/testSetupFocused" // Adjust path if needed

// --- Simple Stubs for Manual Run ---

// 1. Logger Stub
const loggerStub: BaseLogger = {
  info: (...args) => console.log("[INFO]", ...args),
  error: (...args) => console.error("[ERROR]", ...args),
  warn: (...args) => console.warn("[WARN]", ...args),
  debug: (...args) => console.log("[DEBUG]", ...args),
  fatal: (...args) => console.error("[FATAL]", ...args),
  trace: (...args) => console.log("[TRACE]", ...args),
  silent: (...args) => {},
  level: "info",
  child: () => loggerStub, // Simple child implementation
}

// 2. Mock Model Adapter
const mockModelAdapter = createMockDeepseekAdapter()
// Override the run method specifically for this manual test
// Simply assign a new async function to the run property
mockModelAdapter.run = async (options: any) => {
  // Assign directly
  loggerStub.info("Mock model received input, simulating TeamLead...", options)
  // Simulate TeamLead agent identifying requirements and deciding to update state
  return {
    output: [
      {
        type: "tool_call",
        role: "assistant",
        tools: [
          {
            name: "updateTaskState",
            input: {
              newStatus: "NEEDS_REQUIREMENTS_CRITIQUE",
              test_requirements: "Manually generated requirements from stub",
            },
          },
        ],
        stop_reason: "tool",
      },
    ],
    raw: { usage: { total_tokens: 15 } }, // Dummy raw data
    history: [],
    prompt: [],
    toolCalls: [],
  }
} // End of assignment

// 3. Tool Stubs (Handlers will just log)
const createManualToolStub = (baseTool: Tool<any>): Tool<any> => ({
  ...baseTool,
  handler: async (input: any, context: any) => {
    loggerStub.info(`Tool stub [${baseTool.name}] called with input:`, input)
    // In a real scenario, you might want stubs to update state for multi-step tests
    if (baseTool.name === "updateTaskState") {
      context.network?.state.kv.set("status", input.newStatus)
      context.network?.state.kv.set(
        "test_requirements",
        input.test_requirements
      )
      loggerStub.info("State updated by updateTaskState stub")
    }
    return `${baseTool.name} manual stub executed`
  },
})

const updateTaskStateManualStub = createManualToolStub(mockUpdateTaskStateTool)
const webSearchManualStub = createManualToolStub(mockWebSearchTool)
const analyzeCodeManualStub = createManualToolStub(mockAnalyzeCodeTool)
const codexCliManualStub = createManualToolStub(mockCodexCliTool)

// 4. Assemble Dependencies
const manualDeps: AgentDependencies = {
  log: loggerStub,
  model: mockModelAdapter as any, // Cast needed as mock factory might not perfectly match AgentKit type
  allTools: [
    updateTaskStateManualStub,
    webSearchManualStub,
    analyzeCodeManualStub,
    codexCliManualStub,
  ],
  apiKey: "manual-run-key", // Dummy key
  modelName: mockModelAdapter.modelName || "manual-mock-deepseek",
  // systemEvents can be a simple mock for manual runs if not crucial
  systemEvents: {
    emit: async (...args) => loggerStub.info("[EVENT]", ...args),
  },
  sandbox: null, // Assuming no sandbox needed for this test
  eventId: `manual-${Date.now()}`,
}

// 5. Simple Router
const manualRouter = (
  args: { network: any; callCount: number },
  deps: AgentDependencies,
  agentsMap: Map<string, Agent<any>>
): Agent<any> | undefined => {
  loggerStub.info(`Router called (callCount: ${args.callCount})`)
  if (args.callCount === 0) {
    const agent = agentsMap.get("TeamLead")
    if (!agent) {
      loggerStub.error("Manual router could not find TeamLead agent!")
      return undefined
    }
    loggerStub.info("Router returning TeamLead agent")
    return agent
  }
  // Stop after the first agent runs and its tool potentially updates state
  loggerStub.info("Router stopping network run.")
  return undefined
}

// --- Main Execution Logic ---
async function main() {
  loggerStub.info("--- Starting Manual Network Run ---")

  try {
    // 6. Create Network
    // Pass the wrapper for the manual router
    const { network, agentsMap } = createDevOpsNetwork(
      manualDeps,
      (routerArgs, routerDeps) =>
        manualRouter(routerArgs, routerDeps, agentsMap)
    )
    loggerStub.info("Network created successfully.")

    // 7. Define Initial State
    const initialTask = "Manually trigger TeamLead to generate requirements"
    const initialState = createState<TddNetworkState>({
      status: "READY",
      task: initialTask,
      run_id: manualDeps.eventId,
    })
    loggerStub.info("Initial state created:", initialState.data)

    // 8. Run the Network
    loggerStub.info("Running network...")
    const result = await network.run(initialTask, { state: initialState })
    loggerStub.info("Network run finished.")

    // 9. Log Final State
    loggerStub.info("--- Final Network State ---")
    console.log(result.state.kv.all()) // Log the entire KV store

    // 10. Check specific state value updated by stub
    if (result.state.kv.get("status") === "NEEDS_REQUIREMENTS_CRITIQUE") {
      loggerStub.info(
        "✅ Verification Successful: State status updated correctly!"
      )
    } else {
      loggerStub.error(
        "❌ Verification Failed: State status was not updated as expected.",
        { finalStatus: result.state.kv.get("status") }
      )
    }
  } catch (error) {
    loggerStub.error("--- Manual Network Run Failed ---")
    console.error(error)
    process.exit(1)
  }

  loggerStub.info("--- Manual Network Run Complete ---")
}

main()
