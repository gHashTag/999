import { NeonToolkit } from "@neondatabase/toolkit"
import dotenv from "dotenv"
import path from "path"

// Загружаем переменные окружения
dotenv.config({ path: path.join(__dirname, "../.env") })

/**
 * Скрипт для проверки подключения к Neon и просмотра существующих таблиц
 */
async function testNeonConnection() {
  if (!process.env.NEON_DATABASE_URL) {
    console.error("❌ Не найдена переменная окружения NEON_DATABASE_URL")
    process.exit(1)
  }

  try {
    console.log("🔄 Подключение к Neon Database...")
    const toolkit = new NeonToolkit(process.env.NEON_DATABASE_URL)

    // Получаем и выводим список таблиц
    const tablesRes = await toolkit.sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    const tables = tablesRes.map(r => r.table_name)

    console.log("📋 Найдены таблицы:", tables.join(", ") || "таблиц нет")

    // Если таблицы есть, выводим примеры данных
    if (tables.includes("parsingsources")) {
      const sourcesRes = await toolkit.sql`
        SELECT * FROM parsingsources LIMIT 5
      `
      console.log("\n📊 Пример данных из ParsingSources:")
      console.table(sourcesRes)
    }

    if (tables.includes("reelscontent")) {
      const reelsRes = await toolkit.sql`
        SELECT id, reels_url, publication_date, views_count, source_identifier, source_type 
        FROM reelscontent 
        LIMIT 5
      `
      console.log("\n📊 Пример данных из ReelsContent:")
      console.table(reelsRes)
    }

    console.log("\n✅ Подключение к Neon успешно!")
  } catch (error) {
    console.error("❌ Ошибка при подключении к Neon:", error)
    process.exit(1)
  }
}

// Запускаем тест подключения
testNeonConnection()
