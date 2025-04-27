/*
import { describe, it, expect, vi, beforeAll } from "vitest"
import { createOpenCodexAgent } from "@/agents/open-codex/logic/createOpenCodexAgent"

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
}

describe("Agent Communication E2E Tests", () => {
  beforeAll(async () => {
    vi.clearAllMocks()
  })

  it("should complete full agent communication cycle", async () => {
    const agents = {
      coder: {
        ask: vi.fn().mockImplementation(async (q: string) => {
          return `Mock response to: ${q}`
        }),
      },
      critic: {
        ask: vi.fn().mockImplementation(async (q: string) => {
          return `Mock response to: ${q}`
        }),
      },
      tester: {
        ask: vi.fn().mockImplementation(async (q: string) => {
          return `Mock response to: ${q}`
        }),
      },
    }

    const agent = createOpenCodexAgent(agents, { log: mockLogger })

    // Initial request to coder
    const initialResponse = await agent.ask("coder: test message")

    // Verify coder received message
    expect(agents.coder.ask).toHaveBeenCalledWith("test message")
    expect(initialResponse).toContain("Mock response to:")

    // Verify broadcast to other agents
    expect(agents.critic.ask).toHaveBeenCalledWith(
      expect.stringContaining("Mock response to:")
    )
    expect(agents.tester.ask).toHaveBeenCalledWith(
      expect.stringContaining("Mock response to:")
    )

    // Verify logging
    expect(mockLogger.info).toHaveBeenCalled()

    // Trigger an error by sending to an unknown agent
    await agent.ask("unknown: another message")

    // Verify logging (expect error log for unknown agent)
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("Unknown agent: unknown")
    )
  })
})
*/
