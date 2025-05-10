import { Context } from "telegraf"
import type { Update } from "telegraf/types"
import { Scenes } from "telegraf"

/**
 * Расширение типов сеанса сцены Telegraf
 */
export interface ScraperSceneSessionData extends Scenes.SceneSessionData {
  step?: ScraperSceneStep
  projectId?: number
  competitorId?: number
  hashtagId?: number
}

/**
 * Конфигурация для модуля Instagram Scraper Bot
 */
export interface InstagramScraperBotConfig {
  /** Флаг включения/отключения логирования */
  enableLogging?: boolean

  /** Минимальное количество просмотров для фильтрации контента */
  minViews?: number

  /** Максимальное количество дней для фильтрации контента по дате */
  maxAgeDays?: number

  /** Токен Apify для скрапинга (если используется) */
  apifyToken?: string
}

/**
 * Пользователь системы
 */
export interface User {
  id: number
  telegram_id: number
  username?: string
  first_name?: string
  last_name?: string
  created_at: Date
  updated_at: Date
}

/**
 * Проект скрапинга
 */
export interface Project {
  id: number
  user_id: number
  name: string
  is_active: boolean
  created_at: Date
  updated_at: Date
}

/**
 * Конкурент (аккаунт для скрапинга)
 */
export interface Competitor {
  id: number
  project_id: number
  username: string
  instagram_url: string
  notes?: string
  created_at: Date
  updated_at: Date
}

/**
 * Хэштег для скрапинга
 */
export interface Hashtag {
  id: number
  project_id: number
  name: string
  notes?: string
  created_at: Date
  updated_at: Date
}

/**
 * Reel из Instagram
 */
export interface Reel {
  id: number
  project_id: number
  source_type: "competitor" | "hashtag"
  source_id: number
  reels_url: string
  publication_date: Date
  views_count: number
  likes_count?: number
  comments_count?: number
  description?: string
  author_username?: string
  author_id?: string
  audio_title?: string
  audio_artist?: string
  parsed_at: Date
  updated_at: Date
}

/**
 * Интерфейс адаптера хранилища данных
 */
export interface StorageAdapter {
  // Методы для работы с пользователями
  getUserByTelegramId(telegramId: number): Promise<User | null>
  createUser(
    telegramId: number,
    username?: string,
    firstName?: string,
    lastName?: string
  ): Promise<User>

  // Методы для работы с проектами
  getProjectsByUserId(userId: number): Promise<Project[]>
  getProjectById(projectId: number): Promise<Project | null>
  createProject(userId: number, name: string): Promise<Project>
  updateProject(
    projectId: number,
    updates: Partial<
      Omit<Project, "id" | "user_id" | "created_at" | "updated_at">
    >
  ): Promise<Project>

  // Методы для работы с конкурентами
  getCompetitorAccounts(projectId: number): Promise<Competitor[]>
  getCompetitorById(competitorId: number): Promise<Competitor | null>
  createCompetitor(
    projectId: number,
    username: string,
    instagramUrl: string,
    notes?: string
  ): Promise<Competitor>
  updateCompetitor(
    competitorId: number,
    updates: Partial<
      Omit<Competitor, "id" | "project_id" | "created_at" | "updated_at">
    >
  ): Promise<Competitor>
  deleteCompetitor(competitorId: number): Promise<boolean>

  // Методы для работы с хэштегами
  getTrackingHashtags(projectId: number): Promise<Hashtag[]>
  getHashtagById(hashtagId: number): Promise<Hashtag | null>
  createHashtag(
    projectId: number,
    name: string,
    notes?: string
  ): Promise<Hashtag>
  updateHashtag(
    hashtagId: number,
    updates: Partial<
      Omit<Hashtag, "id" | "project_id" | "created_at" | "updated_at">
    >
  ): Promise<Hashtag>
  deleteHashtag(hashtagId: number): Promise<boolean>

  // Методы для работы с Reels
  getReels(
    projectId: number,
    options?: { limit?: number; offset?: number }
  ): Promise<{ reels: Reel[]; total: number }>
  saveReels(
    reels: Omit<Reel, "id" | "created_at" | "updated_at">[]
  ): Promise<number>

  // Вспомогательные методы
  initialize(): Promise<void>
  close(): Promise<void>
}

/**
 * Расширенный контекст Telegraf для модуля Instagram Scraper Bot
 */
export interface ScraperBotContext extends Context<Update> {
  scraperConfig?: InstagramScraperBotConfig
  storage?: StorageAdapter
  scene: Scenes.SceneContextScene<ScraperBotContext>
  session: Scenes.SceneSession<ScraperSceneSessionData>
}

/**
 * Возможные шаги сцены для взаимодействия с пользователем
 */
export enum ScraperSceneStep {
  PROJECTS_LIST = "projects_list",
  COMPETITORS_LIST = "competitors_list",
  HASHTAGS_LIST = "hashtags_list",
  SELECT_SOURCE = "select_source",
  SCRAPING = "scraping",
  RESULTS = "results",
  ADD_PROJECT = "add_project",
  ADD_COMPETITOR = "add_competitor",
  ADD_HASHTAG = "add_hashtag",
}

// Типы для парсинга Instagram
export interface InstagramScrapingOptions {
  apifyToken: string
  minViews: number
  maxAgeDays: number
}

export interface InstagramReelRaw {
  url: string
  publishedAt: string
  viewCount: number
  likeCount?: number
  commentCount?: number
  description?: string
  ownerUsername?: string
  ownerId?: string
  audioTitle?: string
  audioArtist?: string
}
