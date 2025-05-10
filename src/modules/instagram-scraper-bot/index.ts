import { Telegraf, Scenes, session } from "telegraf"
import { ScraperBotContext, InstagramScraperBotConfig } from "./types"
import projectScene from "./scenes/project-scene"

// Импортируем другие сцены (добавим позже)
// import competitorScene from './scenes/competitor-scene';
// import hashtagScene from './scenes/hashtag-scene';
// import scrapeScene from './scenes/scrape-scene';

/**
 * Создает экземпляр модуля Instagram Scraper Bot
 * @param bot Экземпляр бота Telegraf
 * @param config Конфигурация модуля
 */
export function setupInstagramScraperBot(
  bot: Telegraf<ScraperBotContext>,
  config: InstagramScraperBotConfig = {}
) {
  // Настраиваем сессии и сцены
  const stage = new Scenes.Stage<ScraperBotContext>([
    projectScene,
    // competitorScene,
    // hashtagScene,
    // scrapeScene
  ])

  // Добавляем middleware для сессии и сцены
  bot.use(session())
  bot.use(stage.middleware())

  // Настраиваем конфигурацию
  bot.use((ctx, next) => {
    ctx.scraperConfig = config
    return next()
  })

  // Добавляем команду для входа в сцену управления проектами
  bot.command("scraper_projects", ctx =>
    ctx.scene.enter("instagram_scraper_projects")
  )

  // Обработчик для кнопки "Управление проектами" (может быть добавлен в основной бот)
  bot.hears("📊 Управление проектами", ctx =>
    ctx.scene.enter("instagram_scraper_projects")
  )

  // Логируем успешную настройку
  if (config.enableLogging) {
    console.log("Instagram Scraper Bot модуль успешно настроен")
  }

  return {
    // Возвращаем методы для добавления кнопок в основной бот
    getMenuButtons: () => [
      ["📊 Управление проектами", "🔍 Скрапинг Instagram"],
    ],

    // Возвращаем команды для добавления в меню бота
    getCommands: () => [
      {
        command: "scraper_projects",
        description: "Управление проектами скрапера",
      },
      // Другие команды могут быть добавлены здесь
    ],

    // Вход в сцену проектов программно
    enterProjectsScene: (ctx: ScraperBotContext) =>
      ctx.scene.enter("instagram_scraper_projects"),
  }
}

// Экспортируем типы
export * from "./types"

// Экспортируем сцены для возможности расширения
export { projectScene }
