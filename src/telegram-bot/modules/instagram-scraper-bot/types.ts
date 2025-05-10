import { Context } from "telegraf"
import type { Update } from "telegraf/types"

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
 * Расширенный контекст Telegraf для модуля Instagram Scraper Bot
 */
export interface ScraperBotContext extends Context<Update> {
  // Здесь можно добавить дополнительные поля, если они понадобятся
  scraperConfig?: InstagramScraperBotConfig
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
