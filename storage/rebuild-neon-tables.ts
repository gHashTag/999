import { NeonToolkit } from "@neondatabase/toolkit"
import dotenv from "dotenv"
import path from "path"
import * as crypto from "crypto"

// Загружаем переменные окружения из файла .env
dotenv.config({ path: path.join(__dirname, "../.env") })

/**
 * Скрипт для полной очистки и перестроения структуры таблиц в Neon DB
 * для хранения данных Instagram Reels
 */
async function rebuildNeonDatabase() {
  // Проверка подтверждения
  if (process.env.CONFIRM !== "YES") {
    console.log(
      "\n⚠️  ВНИМАНИЕ! Этот скрипт удалит ВСЕ существующие таблицы и создаст новую структуру."
    )
    console.log("⚠️  Все данные будут безвозвратно удалены!")
    console.log(
      "⚠️  Для подтверждения передайте CONFIRM=YES как аргумент командной строки."
    )
    console.log(
      "\n⛔ Операция отменена. Добавьте CONFIRM=YES для подтверждения."
    )
    return
  }

  if (!process.env.NEON_DATABASE_URL) {
    console.error("❌ Не найдена переменная окружения NEON_DATABASE_URL")
    process.exit(1)
  }

  // Инициализация коннекта к Neon
  const toolkit = new NeonToolkit(process.env.NEON_DATABASE_URL)

  try {
    console.log("🔄 Подключение к Neon Database...")

    // Получаем список всех таблиц
    const tablesRes = await toolkit.sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    const tables = tablesRes.map(r => r.table_name)

    console.log("📋 Найдены таблицы:", tables.join(", ") || "таблиц нет")

    // Удаляем все существующие таблицы
    console.log("🗑️ Удаление всех существующих таблиц...")

    // Сначала удаляем зависимые таблицы, затем основные
    for (const table of tables) {
      await toolkit.sql`DROP TABLE IF EXISTS ${table} CASCADE`
      console.log(`  ✓ Таблица "${table}" удалена`)
    }

    console.log("\n🏗️ Создание новой структуры таблиц...")

    // Создаем таблицу ParsingSources (должна быть создана первой из-за foreign key)
    console.log("📊 Создание таблицы ParsingSources...")
    await toolkit.sql`
      CREATE TABLE ParsingSources (
        id SERIAL PRIMARY KEY,
        identifier TEXT UNIQUE NOT NULL,
        type VARCHAR(50) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        last_parsed_at TIMESTAMPTZ,
        notes TEXT
      )
    `

    // Создаем таблицу ReelsContent
    console.log("📊 Создание таблицы ReelsContent...")
    await toolkit.sql`
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
    `

    // Создаем таблицу ParsingLogs
    console.log("📊 Создание таблицы ParsingLogs...")
    await toolkit.sql`
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
    `

    // Создаем индексы для оптимизации запросов
    console.log("\n📈 Создание индексов для оптимизации запросов...")

    // Индексы для ReelsContent
    await toolkit.sql`CREATE INDEX idx_reelscontent_publication_date ON ReelsContent (publication_date)`
    await toolkit.sql`CREATE INDEX idx_reelscontent_views_count ON ReelsContent (views_count)`
    await toolkit.sql`CREATE INDEX idx_reelscontent_source_type ON ReelsContent (source_type)`
    await toolkit.sql`CREATE INDEX idx_reelscontent_author_username ON ReelsContent (author_username)`

    // Индексы для ParsingSources
    await toolkit.sql`CREATE INDEX idx_parsingsources_type ON ParsingSources (type)`
    await toolkit.sql`CREATE INDEX idx_parsingsources_active ON ParsingSources (is_active)`

    // Индексы для ParsingLogs
    await toolkit.sql`CREATE INDEX idx_parsinglogs_run_id ON ParsingLogs (run_id)`
    await toolkit.sql`CREATE INDEX idx_parsinglogs_start_time ON ParsingLogs (start_time)`

    console.log("\n✅ Структура базы данных успешно перестроена!")

    // Выводим информацию о созданных таблицах
    console.log("\n🔍 Проверка структуры новых таблиц:")

    const newTablesRes = await toolkit.sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    const newTables = newTablesRes.map(r => r.table_name)

    for (const table of newTables) {
      const columnsRes = await toolkit.sql`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = ${table} 
        ORDER BY ordinal_position
      `

      console.log(`\n📋 Таблица: ${table}`)
      columnsRes.forEach(col => {
        console.log(
          `  - ${col.column_name} (${col.data_type})${col.is_nullable === "NO" ? " NOT NULL" : ""}`
        )
      })
    }

    // Заполнение таблицы ParsingSources данными
    console.log("\n📝 Заполнение таблицы ParsingSources...")

    // Заполняем аккаунты конкурентов
    const accounts = [
      "https://www.instagram.com/clinicajoelleofficial",
      "https://www.instagram.com/kayaclinicarabia/",
      "https://www.instagram.com/lips_for_kiss",
      "https://www.instagram.com/ziedasclinic?igsh=ZTAxeWZhY3VzYml2",
      "https://www.instagram.com/med_yu_med?igsh=YndwbmQzMHlrbTFh",
      "https://www.instagram.com/milena_aesthetic_clinic/",
      "https://www.instagram.com/graise.aesthetics",
    ]

    for (const account of accounts) {
      await toolkit.sql`
        INSERT INTO ParsingSources (identifier, type) 
        VALUES (${account}, 'account')
        ON CONFLICT (identifier) DO NOTHING
      `
      console.log(`  ✓ Аккаунт "${account}" добавлен`)
    }

    // Заполняем хэштеги
    const hashtags = [
      "#эстетическаямедицина",
      "#увеличениегуб",
      "#губыботокс",
      "#контурнаяпластика",
      "#ботоксгуб",
      "#инъекционнаякосметология",
      "#филлергуб",
      "#филлеры",
      "#мезотерапиялица",
      "#косметологияинъекционная",
      "#филлерыгуб",
      "#биоревитализациялица",
      "#ботоксморщины",
    ]

    for (const hashtag of hashtags) {
      await toolkit.sql`
        INSERT INTO ParsingSources (identifier, type) 
        VALUES (${hashtag}, 'hashtag')
        ON CONFLICT (identifier) DO NOTHING
      `
      console.log(`  ✓ Хэштег "${hashtag}" добавлен`)
    }

    console.log("\n🎉 База данных успешно подготовлена!")
  } catch (error) {
    console.error("❌ Ошибка при перестроении базы данных:", error)
    process.exit(1)
  }
}

// Выполняем функцию
rebuildNeonDatabase()
