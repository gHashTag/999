"use server"

import { OpenAI } from "openai"
import { Message } from "ai"
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

// Вспомогательная функция для выполнения запроса к API
async function callApi(
  action: string,
  params: Record<string, any>
): Promise<Record<string, any>> {
  switch (action) {
    case "get_user":
      await initializeNeonStorage()
      const user = await getUserByTelegramId(params.telegramId)
      await closeNeonStorage()
      return user || {}

    case "get_projects":
      await initializeNeonStorage()
      const projects = await getProjectsByUserId(params.userId)
      await closeNeonStorage()
      return { projects: projects || [] }

    case "get_competitors":
      await initializeNeonStorage()
      const competitors = await getCompetitorAccounts(params.projectId)
      await closeNeonStorage()
      return { competitors: competitors || [] }

    case "get_hashtags":
      await initializeNeonStorage()
      const hashtags = await getTrackingHashtags(params.projectId)
      await closeNeonStorage()
      return { hashtags: hashtags || [] }

    case "scrape_reels":
      await initializeNeonStorage()
      const { sourceType, sourceId, projectId, sourceUrl } = params

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

    default:
      throw new Error(`Неизвестное действие: ${action}`)
  }
}

// Обработчик сообщений пользователя
export async function submitUserMessage(message: string) {
  try {
    // Отправляем запрос к OpenAI для анализа сообщения
    const response = await openai.chat.completions.create({
      model: "gpt-4-0125-preview",
      messages: [
        {
          role: "system",
          content: `Ты — ассистент по управлению скрапером Instagram Reels для эстетической медицины.
          Ты помогаешь пользователям управлять скрапингом, находить информацию и выполнять действия.
          
          Твоя задача — интерпретировать запросы пользователей и определить, какое API-действие нужно выполнить.
          
          Доступные действия:
          1. get_user(telegramId: number) - получить информацию о пользователе
          2. get_projects(userId: number) - получить проекты пользователя
          3. get_competitors(projectId: number) - получить список конкурентов
          4. get_hashtags(projectId: number) - получить список хэштегов
          5. scrape_reels(sourceType: "competitor"|"hashtag", sourceId: number, projectId: number, sourceUrl: string) - запустить скрапинг
          
          Если запрос пользователя не требует выполнения API-действия, просто ответь на него.
          Если требуется выполнить действие, верни JSON в формате: {"action": "название_действия", "params": {...параметры...}}
          
          Говори только на русском языке.`,
        },
        { role: "user", content: message },
      ],
    })

    const assistantMessage = response.choices[0].message.content || ""

    // Проверяем, есть ли в ответе JSON с действием API
    try {
      if (assistantMessage.includes("{") && assistantMessage.includes("}")) {
        // Ищем JSON в сообщении (без использования флага s)
        const jsonMatch = assistantMessage.match(/{[\s\S]*}/)
        if (jsonMatch) {
          const actionData = JSON.parse(jsonMatch[0])

          if (actionData.action && actionData.params) {
            // Выполняем действие API
            const result = await callApi(actionData.action, actionData.params)

            // Формируем итоговый ответ с результатами
            const finalResponse = await openai.chat.completions.create({
              model: "gpt-4-0125-preview",
              messages: [
                {
                  role: "system",
                  content: `Ты — ассистент по управлению скрапером Instagram Reels.
                  Ты получил результат выполнения инструмента ${actionData.action}.
                  Сформируй понятный и полезный ответ на основе этих данных.`,
                },
                { role: "user", content: message },
                {
                  role: "assistant",
                  content: "Выполняю запрос...",
                },
                {
                  role: "user",
                  content: `Результат выполнения действия ${actionData.action}: ${JSON.stringify(result)}`,
                },
              ],
            })

            return (
              finalResponse.choices[0].message.content ||
              "Произошла ошибка при обработке результата"
            )
          }
        }
      }

      // Если нет JSON с действием, возвращаем обычный ответ
      return assistantMessage
    } catch (error) {
      console.error("Ошибка при разборе ответа:", error)
      return assistantMessage
    }
  } catch (error) {
    console.error("Ошибка при обработке сообщения:", error)
    return "Произошла ошибка при обработке запроса. Пожалуйста, попробуйте еще раз."
  }
}
