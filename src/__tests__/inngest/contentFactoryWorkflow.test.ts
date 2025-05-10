import { describe, it, expect, beforeEach, mock } from "bun:test"
import { InngestTestEngine } from "@inngest/test"
import {
  contentFactoryWorkflow,
  type ContentFactoryEventTrigger,
} from "@/inngest/functions/contentFactoryWorkflow"
import {
  // mockLoggerInstance, // Не используется напрямую в этом тесте
  setupTestEnvironment,
  // createFullMockDependencies, // Не используется напрямую в этом тесте
} from "../setup/testSetup"
import type { AgentResult } from "@/types/agents"

describe("contentFactoryWorkflow (MVP - Profile Parsing)", () => {
  beforeEach(() => {
    setupTestEnvironment()
    // createFullMockDependencies(); // Пока не используем, но может понадобиться для agentDeps в будущем
  })

  it("should run the MVP workflow, mock the agent call for profile parsing, and return expected results", async () => {
    const t = new InngestTestEngine({
      function: contentFactoryWorkflow,
      // Мы не передаем client сюда, так как contentFactoryWorkflow уже импортирует inngest из client.ts
    })

    const mockAgentStepId = "run-content-factory-agent-mvp-profile-parsing"
    const testCompetitorUrls = [
      "https://www.instagram.com/testuser1/",
      "https://www.instagram.com/testuser2/",
    ]

    const mockAgentResult: AgentResult = {
      output: [
        {
          type: "text",
          content: `Mocked agent output: Processed ${testCompetitorUrls.length} competitor profiles. Data saved to Neon DB.`,
        },
      ],
      state: {
        status: "PROFILES_PARSED_AND_SAVED",
        processed_count: testCompetitorUrls.length,
        errors: [],
      },
    }

    const agentStepMock = mock().mockResolvedValue(mockAgentResult)

    const testEvent: ContentFactoryEventTrigger = {
      name: "content.factory.run",
      data: {
        eventId: "test-event-mvp-profile-parsing-123",
        competitor_urls: testCompetitorUrls,
      },
    }

    const { result } = await t.execute({
      event: testEvent,
      steps: [{ id: mockAgentStepId, handler: agentStepMock }],
    })

    expect(agentStepMock).toHaveBeenCalledTimes(1)
    // Дополнительно можно проверить, с какими аргументами был вызван мок шага,
    // если бы handler шага в contentFactoryWorkflow.ts передавал agentInput в agent.run()
    // и это было бы важно для теста. Но сейчас agentInput формируется внутри async () => {}

    expect(result.message).toBe(
      "Content Factory Workflow (MVP - Profile Parsing) executed."
    )
    expect(result.finalStatus).toBe("PROFILES_PARSED_AND_SAVED")
    expect(result.data?.processed_count).toBe(testCompetitorUrls.length)
    expect(result.data?.errors).toEqual([])
  })
})
