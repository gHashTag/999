import { NeonToolkit } from "@neondatabase/toolkit"
import dotenv from "dotenv"
import path from "path"

// Загружаем переменные окружения
dotenv.config({ path: path.join(__dirname, "../.env") })

// Типы данных для Reels
export interface InstagramReel {
  reels_url: string
  publication_date?: Date
  views_count?: number
  likes_count?: number
  comments_count?: number
  description?: string
  source_identifier: string
  source_type: string
  author_username?: string
  author_id?: string
  audio_title?: string
  audio_artist?: string
  raw_data?: any
}

// Состояние подключения к базе данных
let toolkit: NeonToolkit | null = null
let project: any = null
let initialized = false

/**
 * Инициализирует подключение к Neon
 */
export async function initializeNeonStorage(): Promise<any> {
  if (initialized && toolkit && project) return project

  try {
    const connectionString = process.env.NEON_DATABASE_URL
    if (!connectionString) {
      throw new Error("NEON_DATABASE_URL не найден в переменных окружения")
    }

    // Создаем экземпляр NeonToolkit
    toolkit = new NeonToolkit(connectionString)

    // В этой версии упрощаем процесс и используем строку подключения как ID проекта
    project = { id: "default", connectionString }
    console.log(`NeonStorage: Используем подключение к Neon`)

    // Создаем таблицы, если они не существуют
    await createTablesIfNotExist()

    initialized = true
    console.log("NeonStorage: Успешно инициализировано подключение к Neon")
    return project
  } catch (error) {
    console.error("NeonStorage: Ошибка инициализации", error)
    throw error
  }
}

/**
 * Создает необходимые таблицы, если они не существуют
 */
async function createTablesIfNotExist() {
  if (!toolkit || !project) {
    throw new Error("NeonStorage: Соединение не инициализировано")
  }

  // Создаем таблицу ReelsContent, если она не существует
  await toolkit.sql`
    CREATE TABLE IF NOT EXISTS ReelsContent (
      id SERIAL PRIMARY KEY,
      reels_url TEXT UNIQUE NOT NULL,
      publication_date TIMESTAMPTZ,
      views_count BIGINT,
      likes_count BIGINT,
      comments_count INTEGER,
      description TEXT,
      source_identifier TEXT NOT NULL,
      source_type VARCHAR(50) NOT NULL,
      author_username VARCHAR(255),
      author_id VARCHAR(255),
      audio_title TEXT,
      audio_artist VARCHAR(255),
      raw_data JSONB,
      parsed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `

  // Создаем индексы
  await toolkit.sql`
    CREATE INDEX IF NOT EXISTS idx_reelscontent_publication_date ON ReelsContent (publication_date)
  `

  await toolkit.sql`
    CREATE INDEX IF NOT EXISTS idx_reelscontent_views_count ON ReelsContent (views_count)
  `

  await toolkit.sql`
    CREATE INDEX IF NOT EXISTS idx_reelscontent_source_identifier ON ReelsContent (source_identifier)
  `
}

/**
 * Сохраняет данные Instagram Reels в базу данных
 */
export async function saveReels(reels: InstagramReel[]): Promise<number> {
  if (!initialized) {
    await initializeNeonStorage()
  }

  if (!toolkit || !project) {
    throw new Error("NeonStorage: Соединение не инициализировано")
  }

  if (!reels.length) return 0

  let savedCount = 0

  for (const reel of reels) {
    try {
      // Проверяем наличие обязательных полей
      if (!reel.reels_url || !reel.source_identifier || !reel.source_type) {
        console.warn(
          "NeonStorage: Пропущена запись из-за отсутствия обязательных полей",
          reel
        )
        continue
      }

      // Выполняем INSERT с ON CONFLICT DO UPDATE для обработки дубликатов
      // Используем тегированные шаблоны с интерполяцией
      const result = await toolkit.sql`
        INSERT INTO ReelsContent (
          reels_url, publication_date, views_count, likes_count, comments_count,
          description, source_identifier, source_type, author_username, 
          author_id, audio_title, audio_artist, raw_data
        ) VALUES (
          ${reel.reels_url}, 
          ${reel.publication_date}, 
          ${reel.views_count}, 
          ${reel.likes_count}, 
          ${reel.comments_count}, 
          ${reel.description}, 
          ${reel.source_identifier}, 
          ${reel.source_type}, 
          ${reel.author_username}, 
          ${reel.author_id}, 
          ${reel.audio_title}, 
          ${reel.audio_artist}, 
          ${reel.raw_data ? JSON.stringify(reel.raw_data) : null}
        )
        ON CONFLICT (reels_url) DO UPDATE SET
          publication_date = EXCLUDED.publication_date,
          views_count = EXCLUDED.views_count,
          likes_count = EXCLUDED.likes_count,
          comments_count = EXCLUDED.comments_count,
          description = EXCLUDED.description,
          source_identifier = EXCLUDED.source_identifier,
          source_type = EXCLUDED.source_type,
          author_username = EXCLUDED.author_username,
          author_id = EXCLUDED.author_id,
          audio_title = EXCLUDED.audio_title,
          audio_artist = EXCLUDED.audio_artist,
          raw_data = EXCLUDED.raw_data,
          updated_at = CURRENT_TIMESTAMP
      `

      savedCount++
    } catch (error) {
      console.error("NeonStorage: Ошибка при сохранении Reels", error)
    }
  }

  return savedCount
}

/**
 * Получает данные Instagram Reels из базы данных по фильтрам
 */
export async function getReels(
  params: {
    source_identifier?: string
    minViews?: number
    daysAgo?: number
    limit?: number
  } = {}
): Promise<InstagramReel[]> {
  if (!initialized) {
    await initializeNeonStorage()
  }

  if (!toolkit || !project) {
    throw new Error("NeonStorage: Соединение не инициализировано")
  }

  try {
    // Формируем базовый запрос
    const conditionsArray = []
    const queryParams: any[] = []

    // Добавляем условия, если они переданы
    if (params.source_identifier) {
      conditionsArray.push(`source_identifier = ${params.source_identifier}`)
    }

    if (params.minViews) {
      conditionsArray.push(`views_count >= ${params.minViews}`)
    }

    if (params.daysAgo) {
      const dateThreshold = new Date()
      dateThreshold.setDate(dateThreshold.getDate() - params.daysAgo)
      conditionsArray.push(`publication_date >= ${dateThreshold}`)
    }

    // Собираем условия в строку WHERE
    const whereClause =
      conditionsArray.length > 0 ? `WHERE ${conditionsArray.join(" AND ")}` : ""

    // Формируем лимит, если он передан
    const limitClause = params.limit ? `LIMIT ${params.limit}` : ""

    // Выполняем запрос с тегированными шаблонами
    const query = `
      SELECT * FROM ReelsContent
      ${whereClause}
      ORDER BY publication_date DESC
      ${limitClause}
    `

    const result = await toolkit.sql`${query}`

    // Преобразуем результаты в объекты InstagramReel
    return result.map(row => ({
      reels_url: row.reels_url,
      publication_date: row.publication_date
        ? new Date(row.publication_date)
        : undefined,
      views_count: row.views_count,
      likes_count: row.likes_count,
      comments_count: row.comments_count,
      description: row.description,
      source_identifier: row.source_identifier,
      source_type: row.source_type,
      author_username: row.author_username,
      author_id: row.author_id,
      audio_title: row.audio_title,
      audio_artist: row.audio_artist,
      raw_data: row.raw_data,
    }))
  } catch (error) {
    console.error("NeonStorage: Ошибка при получении Reels", error)
    return []
  }
}

/**
 * Закрывает подключение к базе данных
 */
export async function closeNeonStorage(): Promise<void> {
  // @neondatabase/toolkit не требует явного закрытия соединения
  // Просто сбрасываем состояние
  toolkit = null
  project = null
  initialized = false
  console.log("NeonStorage: Соединение закрыто")
}
