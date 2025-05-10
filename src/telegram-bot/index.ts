import { Telegraf, session } from "telegraf"
import dotenv from "dotenv"
import {
  setupInstagramScraperBot,
  createNeonStorageAdapter,
  createMemoryStorageAdapter,
  ScraperBotContext,
} from "./modules/instagram-scraper-bot"

// Загружаем переменные окружения
dotenv.config()

// Проверяем наличие токена
const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) {
  console.error("ОШИБКА: TELEGRAM_BOT_TOKEN не указан в переменных окружения")
  process.exit(1)
}

// Создаем экземпляр бота
const bot = new Telegraf<ScraperBotContext>(token)

// Настраиваем middleware для сессий (должен быть до подключения модулей)
bot.use(session())

// Создаем адаптер хранилища в зависимости от конфигурации
// В production это будет Neon DB, для разработки используем Memory Storage
const storageAdapter =
  process.env.NODE_ENV === "production" && process.env.NEON_CONNECTION_STRING
    ? createNeonStorageAdapter(process.env.NEON_CONNECTION_STRING)
    : createMemoryStorageAdapter()

// Настраиваем модуль Instagram Scraper
const scraperBot = setupInstagramScraperBot(bot, storageAdapter, {
  enableLogging: process.env.NODE_ENV !== "production",
  minViews: parseInt(process.env.MIN_VIEWS || "50000"),
  maxAgeDays: parseInt(process.env.MAX_AGE_DAYS || "14"),
  apifyToken: process.env.APIFY_TOKEN,
})

// Middleware для логирования
bot.use(async (ctx, next) => {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  console.log(
    `${ctx.from?.username || ctx.from?.id} - ${ctx.updateType}: ${ms}ms`
  )
})

// Базовые команды бота
bot.start(ctx => {
  ctx.reply(
    `Привет, ${ctx.from.first_name}! Я бот для скрапинга Instagram Reels в нише эстетической медицины.`,
    {
      reply_markup: {
        keyboard: scraperBot.getMenuButtons(),
        resize_keyboard: true,
      },
    }
  )
})

bot.help(ctx => {
  ctx.reply(
    `Доступные команды:
/start - Начать работу с ботом
/menu - Показать главное меню
/projects - Управление проектами
/competitors - Управление конкурентами
/hashtags - Управление хэштегами
/scrape - Запустить скрапинг
/reels - Просмотр результатов`
  )
})

// Показ меню
bot.command("menu", ctx => {
  ctx.reply("Выберите действие:", {
    reply_markup: {
      keyboard: scraperBot.getMenuButtons(),
      resize_keyboard: true,
    },
  })
})

// Регистрируем команды бота для показа в меню Telegram
bot.telegram.setMyCommands([
  { command: "start", description: "Начать работу с ботом" },
  { command: "menu", description: "Показать главное меню" },
  { command: "help", description: "Показать справку" },
  ...scraperBot.getCommands(),
])

// Запуск бота
bot
  .launch()
  .then(() => {
    console.log("Бот успешно запущен!")
    console.log(
      `Минимальное количество просмотров: ${process.env.MIN_VIEWS || "50000"}`
    )
    console.log(
      `Максимальный возраст Reels: ${process.env.MAX_AGE_DAYS || "14"} дней`
    )
  })
  .catch(err => {
    console.error("Ошибка при запуске бота:", err)
  })

// Обработка завершения работы
process.once("SIGINT", () => bot.stop("SIGINT"))
process.once("SIGTERM", () => bot.stop("SIGTERM"))

export default bot
