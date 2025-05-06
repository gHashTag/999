import { Agent, createAgent } from "@inngest/agent-kit"
import { createSmitheryUrl } from "@smithery/sdk/config.js"
import { type AgentDependencies } from "../../../types/agents" // Путь к типам
import { AGENT_CONTENT_FACTORY_SYSTEM_PROMPT } from "../../../prompts/contentFactory"

// Определяем тип для MCP сервера, совместимый с ожиданиями AgentKit
interface CustomMcpServerConfig {
  name: string
  transport:
    | {
        type: "ws"
        url: string
        headers?: Record<string, string>
        protocols?: string | string[]
        queryParams?: Record<string, string>
        idleTimeout?: number
      }
    | {
        type: "sse"
        url: string
        headers?: Record<string, string>
        queryParams?: Record<string, string>
        body?: Record<string, unknown>
        method?: string
      }
}

export const createContentFactoryAgent = (
  dependencies: AgentDependencies
): Agent<any> => {
  const { model, log } = dependencies

  // Определение apifyToken перенесено внутрь функции
  const apifyToken = process.env.APIFY_TOKEN
  let apifyMcpServerConfig: CustomMcpServerConfig | undefined

  if (log) {
    log.info("Creating ContentFactoryAgent... Attempting to read APIFY_TOKEN.")
  }

  if (apifyToken) {
    if (log) log.info("APIFY_TOKEN found. Attempting to configure MCP server.")
    try {
      const smitheryApifyUrl = createSmitheryUrl(
        "https://actors-mcp-server.apify.actor/ws",
        { APIFY_TOKEN: apifyToken }
      )
      apifyMcpServerConfig = {
        name: "apifyInstagramParser",
        transport: {
          type: "ws",
          url: smitheryApifyUrl.toString(),
        },
      }
      if (log) log.info("Apify MCP server configured successfully.")
    } catch (error) {
      if (log) log.error("Failed to create Smithery URL for Apify:", { error }) // Логируем объект ошибки
      console.error("Failed to create Smithery URL for Apify:", error)
    }
  } else {
    if (log)
      log.warn(
        "APIFY_TOKEN is not set. Apify Instagram Parser MCP server will not be configured."
      )
  }

  const mcpServersList: CustomMcpServerConfig[] = []
  if (apifyMcpServerConfig) {
    mcpServersList.push(apifyMcpServerConfig)
  }

  return createAgent({
    name: "ContentFactoryAgent",
    description:
      "Agent responsible for parsing Instagram accounts and managing content workflow.",
    system: AGENT_CONTENT_FACTORY_SYSTEM_PROMPT,
    model,
    tools: [],
    mcpServers:
      mcpServersList.length > 0 ? (mcpServersList as any[]) : undefined,
  })
}
