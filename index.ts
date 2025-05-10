import { ApifyClient } from "apify-client"
import dotenv from "dotenv"
import path from "path"
import { v4 as uuidv4 } from "uuid"

// Загружаем переменные окружения
dotenv.config({ path: path.join(__dirname, ".env") })

// Добавляем отладочный вывод
console.log("Переменные окружения загружены:")
console.log(
  "NEON_DATABASE_URL:",
  process.env.NEON_DATABASE_URL ? "установлен" : "не установлен"
)
console.log(
  "APIFY_API_TOKEN:",
  process.env.APIFY_API_TOKEN ? "установлен" : "не установлен"
)
console.log("RUN_LIVE_TESTS:", process.env.RUN_LIVE_TESTS)

// Типы данных
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

// Экспортируем функции из хранилища
export {
  initializeNeonStorage,
  saveReels,
  getReels,
  closeNeonStorage,
} from "./storage/neonStorage"

/**
 * Получает Instagram Reels с помощью Apify для указанного аккаунта
 * @param account URL аккаунта Instagram
 * @param limit Ограничение по количеству результатов
 * @returns Массив объектов с данными о Reels
 */
export async function fetchReelsFromAccount(
  account: string,
  limit = 20
): Promise<InstagramReel[]> {
  if (!process.env.APIFY_API_TOKEN) {
    throw new Error("APIFY_API_TOKEN не найден в переменных окружения")
  }

  console.log(`Загрузка Reels для аккаунта: ${account}`)

  const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
  })

  try {
    // В итоговой реализации следует использовать правильный Actor ID для Instagram Reels
    // Для MVP используем временный ID, который должен быть заменен на правильный
    const run = await client.actor("apify/instagram-scraper").call({
      usernames: [account],
      resultsLimit: limit,
      resultsType: "reels", // Явно указываем, что нужны только Reels
    })

    const dataset = await client.dataset(run.defaultDatasetId).listItems()

    // Преобразуем данные в формат InstagramReel
    return dataset.items.map(
      (item: any): InstagramReel => ({
        reels_url: item.url,
        publication_date: item.timestamp ? new Date(item.timestamp) : undefined,
        views_count: item.viewCount,
        likes_count: item.likesCount,
        comments_count: item.commentsCount,
        description: item.caption,
        source_identifier: account,
        source_type: "account",
        author_username: item.ownerUsername,
        author_id: item.ownerId,
        audio_title: item.audioTitle,
        audio_artist: item.audioArtist,
        raw_data: item, // Сохраняем сырые данные
      })
    )
  } catch (error) {
    console.error(`Ошибка при загрузке Reels для аккаунта ${account}:`, error)
    throw error
  }
}

/**
 * Фильтрует Reels по дате публикации и количеству просмотров
 * @param reels Массив Reels для фильтрации
 * @param daysAgo Максимальное количество дней с момента публикации (≤ 14 дней)
 * @param minViews Минимальное количество просмотров (≥ 50,000)
 * @returns Отфильтрованный массив Reels
 */
export function filterReels(
  reels: InstagramReel[],
  daysAgo = 14,
  minViews = 50000
): InstagramReel[] {
  const dateThreshold = new Date()
  dateThreshold.setDate(dateThreshold.getDate() - daysAgo)

  return reels.filter(reel => {
    // Проверка даты публикации (если она есть)
    const dateCondition = reel.publication_date
      ? reel.publication_date >= dateThreshold
      : true // Если даты нет, не фильтруем по ней

    // Проверка количества просмотров (если есть)
    const viewsCondition = reel.views_count
      ? reel.views_count >= minViews
      : true // Если просмотров нет, не фильтруем по ним

    return dateCondition && viewsCondition
  })
}

/**
 * Основная функция скрапинга Instagram Reels
 * Загружает данные из списка аккаунтов, фильтрует их и сохраняет в базу данных
 */
export async function scrapeInstagramReels(): Promise<{
  totalFetched: number
  totalSaved: number
  errors: number
}> {
  // Инициализируем глобальный счетчик результатов
  let totalFetched = 0
  let totalSaved = 0
  let errors = 0
  const runId = uuidv4() // Уникальный ID для этого запуска

  console.log(`Запуск скрапинга Instagram Reels (ID: ${runId})`)

  try {
    // Инициализация подключения к базе данных
    await initializeNeonStorage()

    // Получение списка аккаунтов из стейт-файла (в полной реализации - из базы данных)
    // В MVP используем жестко закодированный список
    const accounts = [
      "https://www.instagram.com/clinicajoelleofficial",
      "https://www.instagram.com/kayaclinicarabia/",
      "https://www.instagram.com/lips_for_kiss",
      "https://www.instagram.com/ziedasclinic",
      "https://www.instagram.com/med_yu_med",
      "https://www.instagram.com/milena_aesthetic_clinic/",
      "https://www.instagram.com/graise.aesthetics",
    ]

    // Обходим каждый аккаунт последовательно (в будущих версиях можно распараллелить)
    for (const account of accounts) {
      try {
        console.log(`Обработка аккаунта: ${account}`)

        // Получаем данные через Apify
        const reels = await fetchReelsFromAccount(account)
        totalFetched += reels.length

        console.log(`Получено ${reels.length} Reels от ${account}`)

        // Фильтруем по требованиям (≤ 14 дней, ≥ 50,000 просмотров)
        const filteredReels = filterReels(reels)

        console.log(
          `Отфильтровано: ${filteredReels.length} Reels из ${reels.length}`
        )

        // Сохраняем в базу данных
        if (filteredReels.length > 0) {
          const saved = await saveReels(filteredReels)
          totalSaved += saved
          console.log(`Сохранено в базу данных: ${saved} Reels`)
        }
      } catch (error) {
        console.error(`Ошибка при обработке аккаунта ${account}:`, error)
        errors++
      }
    }

    console.log(`\n📊 Результаты скрапинга (ID: ${runId}):`)
    console.log(`  Всего получено Reels: ${totalFetched}`)
    console.log(`  Всего сохранено в базу: ${totalSaved}`)
    console.log(`  Ошибок: ${errors}`)

    return { totalFetched, totalSaved, errors }
  } catch (error) {
    console.error("Критическая ошибка при скрапинге:", error)
    throw error
  } finally {
    // Закрываем соединение с базой данных
    await closeNeonStorage()
  }
}

// Если файл запущен напрямую (не импортирован)
if (require.main === module) {
  console.log("Запуск скрапера напрямую...")
  scrapeInstagramReels()
    .then(results => {
      console.log("Скрапинг завершен успешно!")
      console.log("Результаты:", results)
    })
    .catch(error => {
      console.error("Ошибка при выполнении скрапинга:", error)
      process.exit(1)
    })
}
