import { describe, it, expect, beforeEach } from "bun:test"
import {
  createFullMockDependencies, // Use new factory
  setupTestEnvironment,
  getMockTools,
  // mockDeepseekModelAdapter, // Removed unused
} from "../setup/testSetup" // UPDATED PATH
import { createTeamLeadAgent } from "@/agents/teamlead/logic/createTeamLeadAgent"
import type { AgentDependencies } from "@/types/agents"

describe("TeamLead Agent Unit Tests", () => {
  let deps: AgentDependencies
  // Определяем инструкции здесь, чтобы они были доступны всем тестам
  const teamLeadInstructions = `Ты - мудрый Руководитель Команды...
Преобразуй задачу в набор ЧЕТКИХ, АТОМАРНЫХ, ПРОВЕРЯЕМЫХ требований.
Ответ ДОЛЖЕН быть ТОЛЬКО нумерованным или маркированным списком.
Пример:
* Требование 1
* Требование 2
`

  beforeEach(() => {
    setupTestEnvironment() // Use exported name
    deps = createFullMockDependencies()
  })

  it("should create a TeamLead agent with default dependencies", () => {
    // Используем teamLeadInstructions
    const agent = createTeamLeadAgent(deps, teamLeadInstructions)
    expect(agent).toBeDefined()
    expect(agent.name).toBe("TeamLead")
  })

  it("should have access to the correct model adapter", () => {
    // Используем teamLeadInstructions
    const agent = createTeamLeadAgent(deps, teamLeadInstructions)
    expect((agent as any).model).toBe(deps.model)
  })

  it("should filter tools correctly based on teamlead requirements", () => {
    const allMockTools = getMockTools([
      "readFile",
      "writeFile",
      "runTerminalCommand",
      "updateTaskState", // TeamLead needs this
      "web_search", // TeamLead needs this
      "mcp_cli-mcp-server_run_command",
      "mcp_cli-mcp-server_show_security_rules",
    ])
    const depsWithTools = createFullMockDependencies({
      allTools: allMockTools,
    })
    // Используем teamLeadInstructions
    const agent = createTeamLeadAgent(depsWithTools, teamLeadInstructions)

    const expectedToolNames = ["updateTaskState", "web_search"].sort()
    const actualToolNames = Array.from(agent.tools.keys()).sort()

    expect(actualToolNames).toEqual(expectedToolNames)
    expect(agent.tools.size).toBe(expectedToolNames.length)
  })

  it("should handle having no tools passed in dependencies", () => {
    const depsWithoutTools = createFullMockDependencies({ allTools: [] })
    // Используем teamLeadInstructions
    const agent = createTeamLeadAgent(depsWithoutTools, teamLeadInstructions)
    expect(agent.tools).toBeDefined()
    expect(agent.tools.size).toBe(0)
  })

  // --- НОВЫЙ ТЕСТ ДЛЯ СИСТЕМНОГО ПРОМПТА --- //
  it("should have a system prompt instructing decomposition and list format", () => {
    // Этот тест уже использует teamLeadInstructions
    const agent = createTeamLeadAgent(deps, teamLeadInstructions)
    const systemPrompt = (agent as any).system

    expect(systemPrompt).toBeDefined()
    expect(systemPrompt).toContain("Преобразуй задачу") // Ключевое слово для декомпозиции
    expect(systemPrompt).toContain("требований")
    expect(systemPrompt).toContain("нумерованным или маркированным списком") // Формат вывода
    expect(systemPrompt).toContain("* Требование 1") // Часть примера
  })
})
