// src/definitions/agentDefinitions.ts

// Импортируем функции создания агентов из их модулей
export { createTeamLeadAgent } from "@/agents/teamlead/logic/createTeamLeadAgent"
export { createTesterAgent } from "@/agents/tester/logic/createTesterAgent"
export { createCodingAgent } from "@/agents/coder/logic/createCodingAgent"
export { createCriticAgent } from "@/agents/critic/logic/createCriticAgent"
export { createToolingAgent } from "@/agents/tooling/logic/createToolingAgent"

// Удаляем весь старый код определения агентов и вспомогательные функции из этого файла.
// Оставляем только импорты и ре-экспорты.
