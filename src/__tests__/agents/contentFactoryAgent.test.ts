import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { createContentFactoryAgent } from "../../agents/contentFactory/logic/createContentFactoryAgent"
import { AGENT_CONTENT_FACTORY_SYSTEM_PROMPT } from "../../prompts/contentFactory"
import {
  createFullMockDependencies,
  // mockApiKey,
  // mockModelName,
  // mockEventId
} from "../setup/testSetup" // Путь к нашему тестовому сетапу
import type { AgentDependencies } from "../../types/agents"

describe("createContentFactoryAgent", () => {
  let mockDeps: AgentDependencies
  let originalApifyToken: string | undefined
  let originalNeonApiKey: string | undefined

  beforeEach(async () => {
    mockDeps = await createFullMockDependencies({})
    // Сохраняем оригинальное значение APIFY_TOKEN и очищаем его для изоляции тестов
    originalApifyToken = process.env.APIFY_TOKEN
    originalNeonApiKey = process.env.NEON_API_KEY
    delete process.env.APIFY_TOKEN
    delete process.env.NEON_API_KEY
  })

  afterEach(() => {
    // Восстанавливаем оригинальное значение APIFY_TOKEN
    if (originalApifyToken !== undefined) {
      process.env.APIFY_TOKEN = originalApifyToken
    } else {
      delete process.env.APIFY_TOKEN
    }
    if (originalNeonApiKey !== undefined) {
      process.env.NEON_API_KEY = originalNeonApiKey
    } else {
      delete process.env.NEON_API_KEY
    }
  })

  it("should create an agent with correct name, description, and system prompt", () => {
    const agent = createContentFactoryAgent(mockDeps)
    expect(agent.name).toBe("ContentFactoryAgent")
    expect(agent.description).toBe(
      "Agent responsible for parsing Instagram accounts and managing content workflow."
    )
    expect(agent.system).toBe(AGENT_CONTENT_FACTORY_SYSTEM_PROMPT)
  })

  it("should not configure any mcpServers if no API keys are set", () => {
    delete process.env.APIFY_TOKEN // Убедимся, что токены не установлены
    delete process.env.NEON_API_KEY
    const agent = createContentFactoryAgent(mockDeps)
    expect(agent.mcpServers).toBeUndefined()
  })

  it("should configure mcpServer for Apify ONLY if only APIFY_TOKEN is set", () => {
    const testApifyToken = "test_apify_token_123"
    process.env.APIFY_TOKEN = testApifyToken
    delete process.env.NEON_API_KEY // Убедимся, что NEON_API_KEY не установлен

    const agent = createContentFactoryAgent(mockDeps)

    expect(agent.mcpServers).toBeDefined()
    expect(agent.mcpServers).toHaveLength(1)
    const mcpConfig = agent.mcpServers?.[0]
    expect(mcpConfig?.name).toBe("apifyInstagramParser")
    expect(mcpConfig?.transport?.type).toBe("ws")
    expect(mcpConfig?.transport?.url).toContain(
      "actors-mcp-server.apify.actor/ws"
    )
  })

  it("should configure mcpServer for Neon ONLY if only NEON_API_KEY is set", () => {
    const testNeonKey = "test_neon_api_key_456"
    process.env.NEON_API_KEY = testNeonKey
    delete process.env.APIFY_TOKEN // Убедимся, что APIFY_TOKEN не установлен

    const agent = createContentFactoryAgent(mockDeps)

    expect(agent.mcpServers).toBeDefined()
    expect(agent.mcpServers).toHaveLength(1)
    const mcpConfig = agent.mcpServers?.[0]
    expect(mcpConfig?.name).toBe("neonDatabase")
    expect(mcpConfig?.transport?.type).toBe("ws")
    expect(mcpConfig?.transport?.url).toContain("server.smithery.ai/neon/ws")
  })

  it("should configure mcpServers for both Apify and Neon if both API keys are set", () => {
    const testApifyToken = "test_apify_token_789"
    const testNeonKey = "test_neon_api_key_101"
    process.env.APIFY_TOKEN = testApifyToken
    process.env.NEON_API_KEY = testNeonKey

    const agent = createContentFactoryAgent(mockDeps)

    expect(agent.mcpServers).toBeDefined()
    expect(agent.mcpServers).toHaveLength(2)

    const apifyConfig = agent.mcpServers?.find(
      s => s.name === "apifyInstagramParser"
    )
    expect(apifyConfig).toBeDefined()
    expect(apifyConfig?.transport?.type).toBe("ws")
    expect(apifyConfig?.transport?.url).toContain(
      "actors-mcp-server.apify.actor/ws"
    )

    const neonConfig = agent.mcpServers?.find(s => s.name === "neonDatabase")
    expect(neonConfig).toBeDefined()
    expect(neonConfig?.transport?.type).toBe("ws")
    expect(neonConfig?.transport?.url).toContain("server.smithery.ai/neon/ws")
  })

  it("should use the provided model from dependencies", () => {
    const agent = createContentFactoryAgent(mockDeps)
    expect(agent.model).toBe(mockDeps.model)
  })

  // TODO: Добавить тесты на использование инструментов, когда они будут определены (если MCP не покроет все)
})
