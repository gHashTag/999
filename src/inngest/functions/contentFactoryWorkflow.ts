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

// Define a more specific event type based on AGENT_ContentFactory.mdc
export interface ContentFactoryEventTrigger {
  // Renamed to avoid conflict if ContentFactoryEvent is used elsewhere
  name: "content.factory.run"
  data: {
    eventId: string
    accountsToParse?: string[]
    hashtagsToParse?: string[]
    filter_criteria?: Record<string, unknown>
    ai_generation_rules?: Record<string, unknown>
    // Add other relevant fields from AGENT_ContentFactory.mdc input
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
    // Added types for handler args
    logger.info("🚀 Content Factory Workflow started", {
      eventData: event.data,
    })

    // Mock SystemEvents for now
    const mockSystemEvents: SystemEvents = {
      emit: async (eventName: string, payload: Record<string, unknown>) => {
        logger.info(`Mock SystemEvent emitted: ${eventName}`, payload)
      },
    }

    // Create the model adapter
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

    const agentCallResult: AgentResult = await step.run(
      "run-content-factory-agent",
      async () => {
        logger.info("Executing contentFactoryAgent.run with input:", event.data)
        // В реальном сценарии мы бы передали что-то осмысленное в agent.run()
        // Например, propmt, сформированный на основе event.data
        // const result = await contentFactoryAgent.run("Parse Instagram content based on event data");
        // Пока мокируем ответ для простоты
        return {
          output: [
            {
              type: "text",
              content:
                "Mocked agent output: Parsed reels and AI content links.",
            },
          ],
          state: {
            status: "COMPLETED_MOCKED", // Обновленный статус
            parsed_reels: [
              {
                link: "mock.com/reel1",
                views: 100,
                description: "mock reel",
                source: "mock_account",
              },
            ],
            ai_content_links: ["mock.com/ai_reel1"],
            manual_content_links: [],
          },
        } as AgentResult // Явное приведение типа
      }
    )

    logger.info("✅ Agent execution completed", { agentCallResult })

    // Пример дальнейшей обработки результата
    if (agentCallResult.state?.status === "COMPLETED_MOCKED") {
      logger.info("Processing COMPLETED_MOCKED state:", {
        parsed_reels: agentCallResult.state.parsed_reels,
        ai_content_links: agentCallResult.state.ai_content_links,
      })
    }

    return {
      message: "Content Factory Workflow executed.",
      finalStatus: agentCallResult.state?.status,
      data: agentCallResult.state, // Возвращаем все состояние для возможного использования
    }
  }
)
