import { describe, it, expect, beforeEach } from "bun:test"
import {
  createFullMockDependencies,
  getMockTools,
  mockLogger,
} from "../setup/testSetupFocused"
import { createCoderAgent } from "@/agents/coder/logic/createCoderAgent"

const coderInstructions =
  "Ты - дисциплинированный Разработчик (Coder) в цикле TDD..."

describe("Agent Definitions: Coder Agent", () => {
  let baseDeps: ReturnType<typeof createFullMockDependencies>

  beforeEach(() => {
    baseDeps = createFullMockDependencies()
  })

  it("should create a Coder agent with correct basic properties", () => {
    const agent = createCoderAgent({
      ...baseDeps,
      instructions: coderInstructions,
    })

    expect(agent.name).toBe("Coder Agent")
    expect(agent.description).toBe(
      "Пишет или исправляет код на основе требований и тестов."
    )
    expect((agent as any).model.options.model).toBe(baseDeps.modelName)
    expect((agent as any).model.options.apiKey).toBe(baseDeps.apiKey)
  })

  it.skip("should generate code using InngestTestEngine", async () => {
    // ... test body remains skipped ...
  })

  it("should generate a system prompt containing core instructions", () => {
    const agent = createCoderAgent({
      ...baseDeps,
      instructions: coderInstructions,
    })

    const systemPrompt = agent.system
    expect(systemPrompt).toBeDefined()
    expect(systemPrompt).toContain(coderInstructions)
    expect(systemPrompt).toContain("Ты - дисциплинированный Разработчик")
  })

  it("should correctly filter tools", () => {
    const allMockTools = getMockTools([
      "readFile",
      "createOrUpdateFiles",
      "runTerminalCommand",
      "edit_file",
      "codebase_search",
      "grep_search",
      "updateTaskState",
      "web_search",
      "writeFile",
      "mcp_cli-mcp-server_run_command",
    ])
    const agent = createCoderAgent({
      ...baseDeps,
      instructions: coderInstructions,
      allTools: allMockTools,
      log: mockLogger,
    })

    expect(agent.tools.size).toBe(6)
  })
})
