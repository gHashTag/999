"use server"

import { OpenAI } from "openai"
import { createAI, getMutableAIState, AIState } from "ai"
import {
  initializeNeonStorage,
  closeNeonStorage,
  getUserByTelegramId,
  getProjectsByUserId,
  getCompetitorAccounts,
  getTrackingHashtags,
  getReels,
  scrapeInstagramReels,
  saveReels,
} from "../../agents/scraper"
import { z } from "zod"

// Инициализируем OpenAI клиент
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Схемы для валидации действий
const UserSchema = z.object({
  telegramId: z.number(),
  username: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})

const ScrapeSchema = z.object({
  sourceType: z.enum(["competitor", "hashtag"]),
  sourceId: z.number(),
  projectId: z.number(),
  sourceUrl: z.string(),
})

// Инструменты для AI
const tools = [
  {
    name: "get_user",
    description: "Получает информацию о пользователе по его Telegram ID",
    parameters: UserSchema.shape.telegramId,
    execute: async (telegramId: number) => {
      await initializeNeonStorage()
      const user = await getUserByTelegramId(telegramId)
      await closeNeonStorage()
      return user
    },
  },
  {
    name: "get_projects",
    description: "Получает проекты пользователя",
    parameters: z.number(),
    execute: async (userId: number) => {
      await initializeNeonStorage()
      const projects = await getProjectsByUserId(userId)
      await closeNeonStorage()
      return projects
    },
  },
  {
    name: "get_competitors",
    description: "Получает список конкурентов проекта",
    parameters: z.number(),
    execute: async (projectId: number) => {
      await initializeNeonStorage()
      const competitors = await getCompetitorAccounts(projectId)
      await closeNeonStorage()
      return competitors
    },
  },
  {
    name: "get_hashtags",
    description: "Получает список отслеживаемых хэштегов проекта",
    parameters: z.number(),
    execute: async (projectId: number) => {
      await initializeNeonStorage()
      const hashtags = await getTrackingHashtags(projectId)
      await closeNeonStorage()
      return hashtags
    },
  },
  {
    name: "scrape_reels",
    description: "Запускает скрапинг Reels",
    parameters: ScrapeSchema,
    execute: async ({
      sourceType,
      sourceId,
      projectId,
      sourceUrl,
    }: z.infer<typeof ScrapeSchema>) => {
      await initializeNeonStorage()

      // Скрапим данные
      const reels = await scrapeInstagramReels(sourceUrl, {
        apifyToken: process.env.APIFY_TOKEN || "",
        minViews: parseInt(process.env.MIN_VIEWS || "50000"),
        maxAgeDays: parseInt(process.env.MAX_AGE_DAYS || "14"),
      })

      // Сохраняем в базу
      const savedCount = await saveReels(reels, projectId, sourceType, sourceId)

      await closeNeonStorage()

      return {
        totalReels: reels.length,
        savedReels: savedCount,
      }
    },
  },
]

// Интерфейс для сообщения
interface Message {
  role: "user" | "assistant"
  content: string
}

// Обработчик сообщений пользователя
export async function submitUserMessage(userInput: string) {
  // Получаем состояние AI
  const aiState = getMutableAIState<typeof AIState>()

  // Обновляем историю сообщений
  const messageHistory = [
    {
      role: "user",
      content: userInput,
    },
  ]

  // Отправляем запрос к OpenAI с инструментами
  const response = await openai.chat.completions.create({
    model: "gpt-4-0125-preview",
    messages: [
      {
        role: "system",
        content: `Ты — ассистент по управлению скрапером Instagram Reels для эстетической медицины.
        Ты помогаешь пользователям управлять скрапингом, находить информацию и выполнять действия.
        
        Твоя задача — интерпретировать запросы пользователей и выполнять соответствующие действия с помощью доступных инструментов.
        
        Говори только на русском языке.`,
      },
      ...messageHistory,
    ],
    tools: tools.map(tool => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: "object",
          properties: {
            [tool.name === "get_user"
              ? "telegramId"
              : tool.name === "get_projects"
                ? "userId"
                : tool.name === "get_competitors" ||
                    tool.name === "get_hashtags"
                  ? "projectId"
                  : "data"]: {
              type: "object",
              properties: tool.parameters ? tool.parameters.shape : {},
            },
          },
          required: [
            tool.name === "get_user"
              ? "telegramId"
              : tool.name === "get_projects"
                ? "userId"
                : tool.name === "get_competitors" ||
                    tool.name === "get_hashtags"
                  ? "projectId"
                  : "data",
          ],
        },
      },
    })),
    tool_choice: "auto",
  })

  // Обработка вызова инструментов
  if (response.choices[0]?.message?.tool_calls) {
    for (const toolCall of response.choices[0].message.tool_calls) {
      const tool = tools.find(t => t.name === toolCall.function.name)
      if (tool) {
        try {
          const args = JSON.parse(toolCall.function.arguments)
          const result = await tool.execute(args)

          // Отправляем результат обратно в OpenAI для формирования ответа
          const followUpResponse = await openai.chat.completions.create({
            model: "gpt-4-0125-preview",
            messages: [
              {
                role: "system",
                content: `Ты — ассистент по управлению скрапером Instagram Reels.
                Ты получил результат выполнения инструмента ${tool.name}.
                Сформируй понятный и полезный ответ на основе этих данных.`,
              },
              ...messageHistory,
              {
                role: "function",
                name: tool.name,
                content: JSON.stringify(result),
              },
            ],
          })

          // Обновляем состояние AI с ответом
          aiState.update({
            role: "assistant",
            content:
              followUpResponse.choices[0]?.message?.content ||
              "Произошла ошибка при обработке запроса",
          })
        } catch (error) {
          aiState.update({
            role: "assistant",
            content: `Произошла ошибка при выполнении действия: ${error}`,
          })
        }
      }
    }
  } else {
    // Если инструменты не вызывались, просто возвращаем ответ
    aiState.update({
      role: "assistant",
      content:
        response.choices[0]?.message?.content || "Не удалось получить ответ",
    })
  }

  return {
    id: Date.now().toString(),
    display: aiState.get().content,
  }
}
