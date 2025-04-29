import {
  setupTestEnvironment,
  createBaseMockDependencies,
  getMockTools,
  findToolMock,
  type AgentDependencies,
} from "../testSetup" // Corrected path
import type { Tool } from "@inngest/agent-kit"
import { createToolingAgent } from "@/definitions/agents/toolingAgent"

// Setup the test environment
setupTestEnvironment()
