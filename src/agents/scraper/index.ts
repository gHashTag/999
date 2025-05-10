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

// Экспорт функций для скрапинга
export { scrapeInstagramReels } from "./scrape/instagram-scraper"

// Экспорт типов
export type {
  InstagramReel,
  User,
  Project,
  CompetitorAccount,
  TrackingHashtag,
  ParsingLog,
  ReelWithSource,
} from "./storage/neonStorage-multitenant"

// Дополнительные типы, которые должны быть экспортированы
export interface ContentSource {
  id: number
  reels_id: number
  source_type: "competitor" | "hashtag"
  competitor_id?: number
  hashtag_id?: number
  project_id: number
  created_at?: Date
}

export interface UserContentInteraction {
  id: number
  user_id: number
  reels_id: number
  is_favorite?: boolean
  is_hidden?: boolean
  notes?: string
  created_at?: Date
  updated_at?: Date
}
