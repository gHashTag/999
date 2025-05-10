import { z } from "zod"

// Схема для входных данных Apify Actor (гибкая, так как параметры актора могут меняться)
export const mcpApifyCallActorInputSchema = z
  .object({
    directUrls: z.array(z.string().url()).optional(),
    resultsType: z.enum(["posts", "details", "comments"]).optional(),
    resultsLimit: z.number().int().positive().optional(),
    searchType: z.enum(["hashtag", "user", "place"]).optional(),
    searchLimit: z.number().int().positive().optional(),
  })
  // .catchall(z.any()) // Позволяет любые другие поля // Временно закомментировано для отладки
  .passthrough() // Более безопасная альтернатива для разрешения дополнительных полей без их строгой типизации

// Схема для базовых параметров вызова Apify Actor
export const mcpApifyCallActorBaseParamsSchema = z.object({
  actorId: z.string(),
})

// Полная схема для параметров вызова Apify Actor
export const mcpApifyCallActorParamsSchema =
  mcpApifyCallActorBaseParamsSchema.extend({
    actorInput: mcpApifyCallActorInputSchema,
  })

// Схема для параметров выполнения SQL-запроса Neon
export const mcpNeonRunSqlParamsSchema = z.object({
  sql: z.string(),
  params: z
    .array(z.union([z.string(), z.number(), z.boolean(), z.null()]))
    .optional(), // Параметры могут быть любого типа, заменено z.any() на более безопасный union
})

// Схема для параметров выполнения SQL-транзакции Neon
export const mcpNeonRunSqlTransactionParamsSchema = z.object({
  sqlStatements: z.array(z.string()),
})

// Интерфейсы (могут быть полезны для типов в коде, не связанных с Zod-валидацией напрямую)
// Оставляем их, так как они могут использоваться в других местах или для лучшей читаемости
export interface McpApifyCallActorBaseParams {
  actorId: string
  // Дальнейшие параметры могут зависеть от конкретного актора
  // но для instagram-scraper это обычно actorInput
}

export interface McpApifyCallActorInput {
  directUrls?: string[]
  resultsType?: "posts" | "details" | "comments" // Примерные типы результатов
  resultsLimit?: number
  searchType?: "hashtag" | "user" | "place"
  searchLimit?: number
  // ... другие параметры специфичные для instagram-scraper
  [key: string]: any // Для гибкости
}

export interface McpApifyCallActorParams extends McpApifyCallActorBaseParams {
  actorInput: McpApifyCallActorInput
}

export interface McpNeonRunSqlParams {
  sql: string
  params?: any[] // Для параметризованных запросов
  // branchId и databaseName обычно берутся из конфигурации MCP сервера
  // или могут быть переопределены здесь, если это поддерживается MCP сервером Neon.
}

export interface McpNeonRunSqlTransactionParams {
  sqlStatements: string[]
  // branchId и databaseName как выше
}
