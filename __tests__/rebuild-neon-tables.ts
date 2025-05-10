import { Client } from "pg"
import dotenv from "dotenv"

dotenv.config()

/**
 * Скрипт для полной очистки и перестроения структуры таблиц в Neon DB
 * для хранения данных Instagram Reels
 */
async function rebuildNeonDatabase() {
  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  try {
    console.log("🔄 Подключение к Neon Database...")
    await client.connect()

    // Получаем список всех таблиц
    const tablesRes = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    )
    const tables = tablesRes.rows.map(r => r.table_name)

    console.log("📋 Найдены таблицы:", tables.join(", ") || "таблиц нет")

    // Удаляем все существующие таблицы
    console.log("🗑️ Удаление всех существующих таблиц...")

    // Сначала удаляем зависимые таблицы, затем основные
    for (const table of tables) {
      await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE`)
      console.log(`  ✓ Таблица "${table}" удалена`)
    }

    console.log("\n🏗️ Создание новой структуры таблиц...")

    // Создаем таблицу ParsingSources (должна быть создана первой из-за foreign key)
    console.log("📊 Создание таблицы ParsingSources...")
    await client.query(`
      CREATE TABLE ParsingSources (
        id SERIAL PRIMARY KEY,
        identifier TEXT UNIQUE NOT NULL,
        type VARCHAR(50) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        last_parsed_at TIMESTAMPTZ,
        notes TEXT
      )
    `)

    // Создаем таблицу ReelsContent
    console.log("📊 Создание таблицы ReelsContent...")
    await client.query(`
      CREATE TABLE ReelsContent (
        id SERIAL PRIMARY KEY,
        reels_url TEXT UNIQUE NOT NULL,
        publication_date DATE,
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
    `)

    // Создаем таблицу ParsingLogs
    console.log("📊 Создание таблицы ParsingLogs...")
    await client.query(`
      CREATE TABLE ParsingLogs (
        id SERIAL PRIMARY KEY,
        run_id UUID NOT NULL,
        source_id INTEGER REFERENCES ParsingSources(id),
        status VARCHAR(50) NOT NULL,
        reels_added_count INTEGER DEFAULT 0,
        errors_encountered_count INTEGER DEFAULT 0,
        start_time TIMESTAMPTZ NOT NULL,
        end_time TIMESTAMPTZ,
        log_message TEXT
      )
    `)

    // Создаем индексы для оптимизации запросов
    console.log("\n📈 Создание индексов для оптимизации запросов...")

    // Индексы для ReelsContent
    await client.query(
      `CREATE INDEX idx_reelscontent_publication_date ON ReelsContent (publication_date)`
    )
    await client.query(
      `CREATE INDEX idx_reelscontent_views_count ON ReelsContent (views_count)`
    )
    await client.query(
      `CREATE INDEX idx_reelscontent_source_type ON ReelsContent (source_type)`
    )
    await client.query(
      `CREATE INDEX idx_reelscontent_author_username ON ReelsContent (author_username)`
    )

    // Индексы для ParsingSources
    await client.query(
      `CREATE INDEX idx_parsingsources_type ON ParsingSources (type)`
    )
    await client.query(
      `CREATE INDEX idx_parsingsources_active ON ParsingSources (is_active)`
    )

    // Индексы для ParsingLogs
    await client.query(
      `CREATE INDEX idx_parsinglogs_run_id ON ParsingLogs (run_id)`
    )
    await client.query(
      `CREATE INDEX idx_parsinglogs_start_time ON ParsingLogs (start_time)`
    )

    console.log("\n✅ Структура базы данных успешно перестроена!")

    // Выводим информацию о созданных таблицах
    console.log("\n🔍 Проверка структуры новых таблиц:")

    const newTablesRes = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    )
    const newTables = newTablesRes.rows.map(r => r.table_name)

    for (const table of newTables) {
      const columnsRes = await client.query(
        `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `,
        [table]
      )

      console.log(`\n📋 Таблица: ${table}`)
      columnsRes.rows.forEach(col => {
        console.log(
          `  - ${col.column_name} (${col.data_type})${col.is_nullable === "NO" ? " NOT NULL" : ""}`
        )
      })
    }
  } catch (error) {
    console.error("❌ Ошибка при перестроении базы данных:", error)
    process.exit(1)
  } finally {
    await client.end()
    console.log("\n👋 Соединение с базой данных закрыто")
  }
}

// Запрашиваем подтверждение перед удалением всех таблиц
console.log(
  "\n⚠️  ВНИМАНИЕ! Этот скрипт удалит ВСЕ существующие таблицы и создаст новую структуру."
)
console.log("⚠️  Все данные будут безвозвратно удалены!")
console.log(
  "⚠️  Для подтверждения передайте CONFIRM=YES как аргумент командной строки.\n"
)

if (process.argv.includes("CONFIRM=YES")) {
  rebuildNeonDatabase().catch(err => {
    console.error("❌ Критическая ошибка:", err)
    process.exit(1)
  })
} else {
  console.log("⛔ Операция отменена. Добавьте CONFIRM=YES для подтверждения.")
  process.exit(0)
}
