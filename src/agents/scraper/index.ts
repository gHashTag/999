// Основной API для мультитенантного скрапера Instagram Reels

// Экспорт функций для работы с базой данных
export {
  // Управление подключением
  initializeNeonStorage,
  closeNeonStorage,

  // API для пользователей и проектов
  createUser,
  getUserByTelegramId,
  createProject,
  getProjectsByUserId,

  // API для источников данных
  addCompetitorAccount,
  getCompetitorAccounts,
  addTrackingHashtag,
  getTrackingHashtags,

  // API для работы с контентом
  saveReels,
  getReels,
  getProjectStats,

  // API для взаимодействий пользователей
  addToFavorites,
  removeFromFavorites,
  hideReel,
  getReelInteraction,
  getFavoriteReels,

  // API для логирования
  getParsingLogs,
} from "./storage/neonStorage-multitenant"

// Экспорт типов
export type {
  InstagramReel,
  User,
  Project,
  CompetitorAccount,
  TrackingHashtag,
  ParsingLogEntry,
} from "./storage/neonStorage-multitenant"

// Импорт для работы с Apify
import { ApifyClient } from "apify-client"

// Функция для скрапинга Instagram Reels через Apify
export async function scrapeInstagramReels(
  apifyToken: string,
  sources: { type: "username" | "hashtag"; value: string }[],
  options: {
    limit?: number
    minViews?: number
    maxDaysOld?: number
  } = {}
): Promise<import("./storage/neonStorage-multitenant").InstagramReel[]> {
  if (!apifyToken) throw new Error("apifyToken is required")
  if (!sources || sources.length === 0) throw new Error("sources is required")

  const client = new ApifyClient({ token: apifyToken })

  // Преобразуем источники в формат, понятный Apify
  const usernames = sources
    .filter(source => source.type === "username")
    .map(source => source.value)

  const hashtags = sources
    .filter(source => source.type === "hashtag")
    .map(source => source.value)

  // Формируем входные данные для актора
  const input: any = {
    resultsLimit: options.limit || 100,
  }

  if (usernames.length > 0) {
    input.username = usernames
  }

  if (hashtags.length > 0) {
    input.hashtags = hashtags
  }

  try {
    // Запускаем актор (ID актора может отличаться в зависимости от нужного актора в Apify)
    const run = await client.actor("xMc5Ga1oCONPmWJIa").call(input)

    // Получаем результаты из датасета
    const dataset = await client.dataset(run.defaultDatasetId).listItems()

    // Преобразуем в формат InstagramReel
    const reels = dataset.items.map((item: any) => ({
      reels_url: item.url,
      publication_date: item.timestamp ? new Date(item.timestamp) : undefined,
      views_count: item.viewCount,
      likes_count: item.likesCount,
      comments_count: item.commentsCount,
      description: item.caption,
      author_username: item.ownerUsername,
      author_id: item.ownerId,
      audio_title: item.audioTitle,
      audio_artist: item.audioAuthor,
      thumbnail_url: item.thumbnailUrl,
      duration_seconds: item.durationSec,
      raw_data: item,
    }))

    // Применяем фильтрацию если нужно
    let filteredReels = reels

    if (options.minViews) {
      filteredReels = filteredReels.filter(
        reel =>
          typeof reel.views_count === "number" &&
          reel.views_count >= options.minViews!
      )
    }

    if (options.maxDaysOld && options.maxDaysOld > 0) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - options.maxDaysOld)

      filteredReels = filteredReels.filter(
        reel => reel.publication_date && reel.publication_date >= cutoffDate
      )
    }

    return filteredReels
  } catch (error) {
    console.error("Error in scrapeInstagramReels:", error)
    throw error
  }
}
