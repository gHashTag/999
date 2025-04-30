import { describe, it, expect, beforeEach } from "bun:test"
import {
  createBaseMockDependencies,
  type AgentDependencies,
} from "../setup/testSetupFocused"
import { createCoderAgent } from "@/agents/coder/logic/createCoderAgent"

describe("Agent Definitions: Coder Agent", () => {
  let coderInstructions: string
  let baseDeps: AgentDependencies

  beforeEach(() => {
    baseDeps = createBaseMockDependencies()
  })

  it("should create a Coder agent with correct basic properties", () => {
    coderInstructions = "Test coder instructions"
    const agent = createCoderAgent({
      ...baseDeps,
      instructions: coderInstructions,
    })

    expect(agent.name).toBe("Coder Agent")
    expect(agent.description).toBe(
      "Пишет или исправляет код на основе требований и тестов."
    )
    expect(agent.model).toBe(baseDeps.model)
    expect(agent.tools).toBeDefined()
  })

  // Skip this test due to @inngest/test internalEvents error
  it.skip("should generate code using InngestTestEngine", async () => {
    // ... test body remains skipped ...
  })

  it("should generate a system prompt containing core instructions", () => {
    coderInstructions = "Ты - дисциплинированный Разработчик"
    const agent = createCoderAgent({
      ...baseDeps,
      instructions: coderInstructions,
      allTools: [],
    })

    const systemPrompt = agent.system
    expect(systemPrompt).toBeDefined()
    expect(systemPrompt).toContain(coderInstructions)
    expect(systemPrompt).toContain("Ты - дисциплинированный Разработчик")
  })

  it("should correctly filter tools", () => {
    coderInstructions = "Instructions for tool filter test"
    const agent = createCoderAgent({
      ...baseDeps,
      instructions: coderInstructions,
    })

    expect(agent.tools.size).toBe(3)
    expect(agent.tools.has("readFile")).toBe(true)
    expect(agent.tools.has("runTerminalCommand")).toBe(true)
    expect(agent.tools.has("edit_file")).toBe(true)
    expect(agent.tools.has("writeFile")).toBe(false)
    expect(agent.tools.has("web_search")).toBe(false)
    expect(agent.tools.has("updateTaskState")).toBe(false)
    expect(agent.tools.has("runCommand")).toBe(false)
    expect(agent.tools.has("mcp_cli-mcp-server_run_command")).toBe(false)
  })
})
