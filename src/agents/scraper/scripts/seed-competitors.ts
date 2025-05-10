import dotenv from "dotenv"
import path from "path"
import {
  initializeNeonStorage,
  closeNeonStorage,
  createUser,
  getUserByTelegramId,
  createProject,
  getProjectsByUserId,
  addCompetitorAccount,
  getCompetitorAccounts,
  saveReels,
  scrapeInstagramReels,
} from "../index"

// Загружаем переменные окружения
dotenv.config({ path: path.join(__dirname, "../../.env") })

// Конфигурация
const TELEGRAM_ID = process.env.DEMO_USER_ID || "12345678"
const APIFY_TOKEN = process.env.APIFY_TOKEN

// Список аккаунтов конкурентов из документации AGENT_SCRAPER
const COMPETITOR_ACCOUNTS = [
  "https://www.instagram.com/clinicajoelleofficial",
  "https://www.instagram.com/kayaclinicarabia/",
  "https://www.instagram.com/lips_for_kiss",
  "https://www.instagram.com/ziedasclinic?igsh=ZTAxeWZhY3VzYml2",
  "https://www.instagram.com/med_yu_med?igsh=YndwbmQzMHlrbTFh",
  "https://www.instagram.com/milena_aesthetic_clinic/",
  "https://www.instagram.com/graise.aesthetics",
]

// Функция для извлечения имени аккаунта из URL
function extractAccountName(url: string): string {
  // Удаляем параметры запроса и слеш в конце
  const cleanUrl = url.split("?")[0].replace(/\/$/, "")
  // Извлекаем имя аккаунта (последний компонент URL)
  const parts = cleanUrl.split("/")
  return parts[parts.length - 1]
}

async function main() {
  if (!APIFY_TOKEN) {
    console.error("Ошибка: Не указан APIFY_TOKEN в .env файле")
    process.exit(1)
  }

  try {
    console.log("Инициализация подключения к Neon...")
    await initializeNeonStorage()

    // 1. Создаем или получаем пользователя
    console.log(`Поиск/создание пользователя с Telegram ID: ${TELEGRAM_ID}`)
    let user = await getUserByTelegramId(Number(TELEGRAM_ID))

    if (!user) {
      user = await createUser(Number(TELEGRAM_ID), "demo_user", "Demo", "User")
      console.log(
        `Создан новый пользователь: ${user.username} (ID: ${user.id})`
      )
    } else {
      console.log(
        `Найден существующий пользователь: ${user.username} (ID: ${user.id})`
      )
    }

    // 2. Создаем или получаем проект
    console.log(`Поиск/создание проекта для пользователя ID: ${user.id}`)
    const projects = await getProjectsByUserId(user.id)
    let project

    if (!projects || projects.length === 0) {
      project = await createProject(
        user.id,
        "Aesthetic Medicine",
        "Проект по мониторингу конкурентов в нише эстетической медицины",
        "Эстетическая медицина"
      )
      console.log(`Создан новый проект: ${project.name} (ID: ${project.id})`)
    } else {
      project = projects[0]
      console.log(
        `Найден существующий проект: ${project.name} (ID: ${project.id})`
      )
    }

    // 3. Добавляем аккаунты конкурентов
    console.log("Добавление аккаунтов конкурентов:")

    // Получаем существующих конкурентов, чтобы избежать дублирования
    const existingCompetitors = await getCompetitorAccounts(project.id)
    const existingUrls = existingCompetitors.map(c => c.instagram_url)

    // Фильтруем только новых конкурентов
    const newCompetitors = COMPETITOR_ACCOUNTS.filter(
      url => !existingUrls.includes(url)
    )

    if (newCompetitors.length === 0) {
      console.log("Все конкуренты уже добавлены в проект.")
    } else {
      // Добавляем новых конкурентов
      for (const url of newCompetitors) {
        const accountName = extractAccountName(url)
        const competitor = await addCompetitorAccount(
          project.id,
          url,
          accountName
        )
        console.log(`Добавлен конкурент: ${accountName} (ID: ${competitor.id})`)
      }
    }

    // 4. Запускаем скрапинг данных
    console.log("\nЗапуск скрапинга данных по конкурентам...")

    // Получаем всех конкурентов для текущего проекта
    const competitors = await getCompetitorAccounts(project.id)

    // Формируем источники для скрапинга
    const sources = competitors.map(competitor => ({
      type: "username" as const,
      value: extractAccountName(competitor.instagram_url),
    }))

    console.log(
      `Начинаем скрапинг для ${sources.length} аккаунтов конкурентов...`
    )

    // Запускаем скрапинг с фильтрами из документации
    const reels = await scrapeInstagramReels(APIFY_TOKEN, sources, {
      maxDaysOld: 14, // не старше 14 дней
      minViews: 50000, // не менее 50,000 просмотров
    })

    console.log(`Получено ${reels.length} Reels, соответствующих критериям.`)

    // 5. Сохраняем полученные Reels в базу данных
    if (reels.length > 0) {
      // Маппинг для связи с источниками
      const contentSources = reels.map(reel => {
        const competitor = competitors.find(comp =>
          comp.instagram_url.includes(reel.author_username || "")
        )

        return {
          reelsUrl: reel.reels_url,
          sourceId: competitor?.id,
          sourceType: "account",
        }
      })

      // Сохраняем данные в базу
      const savedCount = await saveReels(project.id, reels, contentSources)
      console.log(`Сохранено ${savedCount} Reels в базу данных Neon.`)
    } else {
      console.log("Нет данных для сохранения в базу.")
    }

    console.log("\nРабота скрипта успешно завершена!")
  } catch (error) {
    console.error("Ошибка при выполнении скрипта:", error)
  } finally {
    await closeNeonStorage()
  }
}

// Запускаем основную функцию
main()
