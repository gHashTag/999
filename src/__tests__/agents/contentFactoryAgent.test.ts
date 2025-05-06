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

  beforeEach(async () => {
    mockDeps = await createFullMockDependencies({})
    // Сохраняем оригинальное значение APIFY_TOKEN и очищаем его для изоляции тестов
    originalApifyToken = process.env.APIFY_TOKEN
    delete process.env.APIFY_TOKEN
  })

  afterEach(() => {
    // Восстанавливаем оригинальное значение APIFY_TOKEN
    if (originalApifyToken !== undefined) {
      process.env.APIFY_TOKEN = originalApifyToken
    } else {
      delete process.env.APIFY_TOKEN
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

  it("should not configure mcpServers if APIFY_TOKEN is not set", () => {
    delete process.env.APIFY_TOKEN // Убедимся, что токен не установлен
    const agent = createContentFactoryAgent(mockDeps)
    // Ожидаем, что mcpServers будет undefined или пустым массивом
    // В createContentFactoryAgent, если mcpServersList пуст, mcpServers будет undefined
    expect(agent.mcpServers).toBeUndefined()
  })

  it("should configure mcpServers for Apify if APIFY_TOKEN is set", () => {
    const testApifyToken = "test_apify_token_123"
    process.env.APIFY_TOKEN = testApifyToken

    // Чтобы createSmitheryUrl не вызывался с реальным токеном в тестах,
    // и чтобы мы могли проверить его вызов, мы можем его замокать.
    // Однако, createContentFactoryAgent уже содержит логику создания конфига внутри себя.
    // Поэтому мы просто создаем агента и проверяем результат.
    // Важно: этот тест проверит, что логика *внутри* createContentFactoryAgent
    // пытается создать конфиг. Он не проверяет сам createSmitheryUrl.

    const agent = createContentFactoryAgent(mockDeps)

    expect(agent.mcpServers).toBeDefined()
    expect(agent.mcpServers).toHaveLength(1)
    const mcpConfig = agent.mcpServers?.[0]
    expect(mcpConfig?.name).toBe("apifyInstagramParser")
    expect(mcpConfig?.transport?.type).toBe("ws")
    // Проверяем, что URL содержит ожидаемый хост и токен (в моковом виде, если бы мы мокали createSmitheryUrl)
    // В данном случае URL генерируется createSmitheryUrl, который мы не мокаем здесь,
    // но он должен содержать переданный токен.
    // Для более точной проверки URL можно было бы мокать createSmitheryUrl.
    expect(mcpConfig?.transport?.url).toContain(
      "actors-mcp-server.apify.actor/ws"
    )
    // Проверка самого токена в URL затруднительна без мока createSmitheryUrl,
    // так как он может быть закодирован или преобразован.
    // Но мы можем проверить, что агент был создан с токеном.
    // Это косвенно проверяется тем, что apifyMcpServerConfig был создан.
  })

  it("should use the provided model from dependencies", () => {
    const agent = createContentFactoryAgent(mockDeps)
    expect(agent.model).toBe(mockDeps.model)
  })

  // TODO: Добавить тесты на использование инструментов, когда они будут определены (если MCP не покроет все)
})
