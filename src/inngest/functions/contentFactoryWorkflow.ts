import { inngest } from "@/inngest/client"
import { createContentFactoryAgent } from "@/agents/contentFactory/logic/createContentFactoryAgent"
import type { AgentResult } from "@/types/agents" // Ensure this type is correctly defined and exported
// import { modelos } from "@/utils/openai/modelos" // Удаляем неиспользуемый импорт
import { openai } from "@inngest/agent-kit" // Import openai model adapter
import type {
  AgentDependencies,
  BaseLogger,
  SystemEvents,
} from "@/types/agents" // Import necessary types

// Обновляем ContentFactoryEventTrigger для MVP
export interface ContentFactoryEventTrigger {
  name: "content.factory.run"
  data: {
    eventId: string
    competitor_urls: string[]
    // Остальные поля, специфичные для Reels, пока убираем или делаем опциональными для MVP
    // accountsToParse?: string[]
    // hashtagsToParse?: string[]
    // filter_criteria?: Record<string, unknown>
    // ai_generation_rules?: Record<string, unknown>
  }
}

export const contentFactoryWorkflow = inngest.createFunction(
  { id: "content-factory-workflow", name: "Content Factory Workflow" },
  { event: "content.factory.run" as const },
  async ({
    event,
    step,
    logger,
  }: {
    event: ContentFactoryEventTrigger
    step: any
    logger: BaseLogger
  }) => {
    logger.info(
      "🚀 Content Factory Workflow started for MVP (Profile Parsing)",
      {
        eventData: event.data,
      }
    )

    const mockSystemEvents: SystemEvents = {
      emit: async (eventName: string, payload: Record<string, unknown>) => {
        logger.info(`Mock SystemEvent emitted: ${eventName}`, payload)
      },
    }

    const modelAdapter = openai({
      model: "deepseek/deepseek-coder",
      apiKey: process.env.DEEPSEEK_API_KEY || "MOCK_DEEPSEEK_API_KEY",
    })

    const agentDeps: AgentDependencies = {
      log: logger,
      apiKey: process.env.DEEPSEEK_API_KEY || "MOCK_DEEPSEEK_API_KEY",
      modelName: "deepseek/deepseek-coder",
      systemEvents: mockSystemEvents,
      sandbox: null,
      eventId: event.data.eventId,
      kv: undefined,
      model: modelAdapter,
      tools: [],
    }

    const contentFactoryAgent = createContentFactoryAgent(agentDeps)
    logger.info(
      `🤖 ContentFactoryAgent '${contentFactoryAgent.name}' initialized.`
    )

    // Готовим входные данные для агента на основе event.data
    const agentInput = {
      competitor_urls: event.data.competitor_urls,
      // Можно добавить другие метаданные из event.data, если они нужны агенту
    }

    const agentCallResult: AgentResult = await step.run(
      "run-content-factory-agent-mvp-profile-parsing",
      async () => {
        logger.info("Executing contentFactoryAgent.run with input:", agentInput)
        // В реальном сценарии:
        // const result = await contentFactoryAgent.run(agentInput)
        // return result

        // Пока мокируем ответ для простоты и для тестов
        // Этот мок должен симулировать успешное завершение парсинга профилей
        return {
          output: [
            {
              type: "text",
              content: `Mocked agent output: Processed ${agentInput.competitor_urls.length} competitor profiles. Data saved to Neon DB.`,
            },
          ],
          state: {
            status: "PROFILES_PARSED_AND_SAVED",
            processed_count: agentInput.competitor_urls.length,
            errors: [],
          },
        } as AgentResult
      }
    )

    logger.info("✅ Agent execution for profile parsing completed", {
      agentCallResult,
    })

    if (agentCallResult.state?.status === "PROFILES_PARSED_AND_SAVED") {
      logger.info("Workflow logic for PROFILES_PARSED_AND_SAVED state:", {
        processed_count: agentCallResult.state.processed_count,
      })
      // Здесь может быть логика для запуска следующего этапа (например, парсинг Reels для этих конкурентов)
    }

    return {
      message: "Content Factory Workflow (MVP - Profile Parsing) executed.",
      finalStatus: agentCallResult.state?.status,
      data: agentCallResult.state,
    }
  }
)
