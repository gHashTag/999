import { NeonToolkit } from "@neondatabase/toolkit"
import dotenv from "dotenv"

dotenv.config()

// Типы данных для Reels
export interface InstagramReel {
  url: string
  username: string
  caption?: string
  views_count?: number
  publication_date?: Date
  source_identifier?: string
  source_type?: string
  likes_count?: number
  comments_count?: number
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
    const apiKey = process.env.NEON_API_KEY
    if (!apiKey) {
      throw new Error("NEON_API_KEY не найден в переменных окружения")
    }

    // Создаем экземпляр NeonToolkit
    toolkit = new NeonToolkit(apiKey)

    // Проверяем, есть ли существующий проект или создаем новый
    // В реальном приложении, скорее всего, нужно использовать существующий проект
    // но для демонстрации работы с API покажем оба подхода
    const connectionString = process.env.NEON_DATABASE_URL

    if (connectionString) {
      // Получаем идентификатор проекта из строки подключения
      // Примерная строка: postgresql://user:pass@ep-cool-name-123456.us-east-2.aws.neon.tech/dbname
      const projectIdMatch = connectionString.match(/ep-[a-z-]+-\d+/)

      if (projectIdMatch) {
        const projectId = projectIdMatch[0]
        console.log(`NeonStorage: Используем существующий проект ${projectId}`)
        project = { id: projectId, connectionString }
      } else {
        console.log(
          "NeonStorage: Не удалось определить ID проекта из строки подключения, создаем новый"
        )
        project = await toolkit.createProject()
      }
    } else {
      console.log(
        "NeonStorage: Строка подключения не найдена, создаем новый проект"
      )
      project = await toolkit.createProject()
    }

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

  // Создаем таблицу content
  await toolkit.sql(
    project,
    `
    CREATE TABLE IF NOT EXISTS content (
      id SERIAL PRIMARY KEY,
      url TEXT UNIQUE NOT NULL,
      username VARCHAR(255) NOT NULL,
      caption TEXT,
      views_count BIGINT,
      publication_date TIMESTAMPTZ,
      source_identifier TEXT,
      source_type VARCHAR(50),
      likes_count BIGINT,
      comments_count INTEGER,
      author_username VARCHAR(255),
      author_id VARCHAR(255),
      audio_title TEXT,
      audio_artist VARCHAR(255),
      raw_data JSONB,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
    `
  )

  // Создаем индексы
  await toolkit.sql(
    project,
    `CREATE INDEX IF NOT EXISTS idx_content_username ON content (username)`
  )

  await toolkit.sql(
    project,
    `CREATE INDEX IF NOT EXISTS idx_content_publication_date ON content (publication_date)`
  )

  await toolkit.sql(
    project,
    `CREATE INDEX IF NOT EXISTS idx_content_views_count ON content (views_count)`
  )
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
      if (!reel.url || !reel.username) {
        console.warn(
          "NeonStorage: Пропущена запись из-за отсутствия обязательных полей",
          reel
        )
        continue
      }

      // Выполняем INSERT с ON CONFLICT DO UPDATE для обработки дубликатов
      // Используем параметризованный запрос с $n нотацией
      const result = await toolkit.sql(
        project,
        `
        INSERT INTO content (
          url, username, caption, views_count, publication_date,
          source_identifier, source_type, likes_count, comments_count,
          author_username, author_id, audio_title, audio_artist, raw_data
        ) VALUES (
          '${reel.url}', 
          '${reel.username}', 
          ${reel.caption ? `'${reel.caption.replace(/'/g, "''")}'` : "NULL"}, 
          ${reel.views_count || "NULL"}, 
          ${reel.publication_date ? `'${reel.publication_date.toISOString()}'` : "NULL"}, 
          ${reel.source_identifier ? `'${reel.source_identifier.replace(/'/g, "''")}'` : "NULL"}, 
          ${reel.source_type ? `'${reel.source_type.replace(/'/g, "''")}'` : "NULL"}, 
          ${reel.likes_count || "NULL"}, 
          ${reel.comments_count || "NULL"}, 
          ${reel.author_username ? `'${reel.author_username.replace(/'/g, "''")}'` : "NULL"}, 
          ${reel.author_id ? `'${reel.author_id.replace(/'/g, "''")}'` : "NULL"}, 
          ${reel.audio_title ? `'${reel.audio_title.replace(/'/g, "''")}'` : "NULL"}, 
          ${reel.audio_artist ? `'${reel.audio_artist.replace(/'/g, "''")}'` : "NULL"}, 
          ${reel.raw_data ? `'${JSON.stringify(reel.raw_data).replace(/'/g, "''")}'` : "NULL"}
        )
        ON CONFLICT (url) DO UPDATE SET
          username = EXCLUDED.username,
          caption = EXCLUDED.caption,
          views_count = EXCLUDED.views_count,
          publication_date = EXCLUDED.publication_date,
          source_identifier = EXCLUDED.source_identifier,
          source_type = EXCLUDED.source_type,
          likes_count = EXCLUDED.likes_count,
          comments_count = EXCLUDED.comments_count,
          author_username = EXCLUDED.author_username,
          author_id = EXCLUDED.author_id,
          audio_title = EXCLUDED.audio_title,
          audio_artist = EXCLUDED.audio_artist,
          raw_data = EXCLUDED.raw_data,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id
        `
      )

      // Проверяем результат
      const rows = Array.isArray(result) ? result : result.rows || []
      if (rows && rows.length > 0) {
        savedCount++
      }
    } catch (error) {
      console.error(`NeonStorage: Ошибка сохранения Reel ${reel.url}:`, error)
    }
  }

  return savedCount
}

/**
 * Получает сохраненные Reels из базы данных
 */
export async function getReels(
  params: {
    username?: string
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

  const { username, minViews, daysAgo, limit = 100 } = params

  // Формируем условия WHERE и параметры
  const conditions = []

  if (username) {
    conditions.push(`username = '${username.replace(/'/g, "''")}'`)
  }

  if (minViews) {
    conditions.push(`views_count >= ${minViews}`)
  }

  if (daysAgo) {
    conditions.push(
      `publication_date >= CURRENT_DATE - INTERVAL '${daysAgo} days'`
    )
  }

  // Формируем полный запрос
  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

  const query = `
    SELECT 
      url, username, caption, views_count, publication_date,
      source_identifier, source_type, likes_count, comments_count,
      author_username, author_id, audio_title, audio_artist, raw_data
    FROM content
    ${whereClause}
    ORDER BY publication_date DESC
    LIMIT ${limit}
  `

  // Выполняем запрос
  const result = await toolkit.sql(project, query)

  // Преобразуем результат
  const rows = Array.isArray(result) ? result : result.rows || []

  return rows.map((row: any) => ({
    url: row.url,
    username: row.username,
    caption: row.caption,
    views_count: row.views_count,
    publication_date: row.publication_date,
    source_identifier: row.source_identifier,
    source_type: row.source_type,
    likes_count: row.likes_count,
    comments_count: row.comments_count,
    author_username: row.author_username,
    author_id: row.author_id,
    audio_title: row.audio_title,
    audio_artist: row.audio_artist,
    raw_data: row.raw_data ? JSON.parse(row.raw_data) : row.raw_data,
  }))
}

/**
 * Закрывает подключение к базе данных
 */
export async function closeNeonStorage(): Promise<void> {
  if (toolkit && project) {
    try {
      // Для @neondatabase/toolkit нет явного завершения соединения
      // Но можно удалить проект, если он был создан временно
      // await toolkit.deleteProject(project)
      initialized = false
      toolkit = null
      project = null
      console.log("NeonStorage: Соединение закрыто")
    } catch (error) {
      console.error("NeonStorage: Ошибка при закрытии соединения", error)
    }
  }
}
