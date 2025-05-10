import { describe, it, expect, vi, beforeEach } from "vitest"
import { Telegraf } from "telegraf"
import { setupInstagramScraperBot } from ".."
import type { ScraperBotContext } from "../types"

// Импортируем наш модуль для тестирования и моки
import "./setup"
import { telegrafMocks } from "./setup"

describe("Instagram Scraper Bot Module", () => {
  let bot: Telegraf<ScraperBotContext>

  beforeEach(() => {
    // Создаем новый экземпляр бота перед каждым тестом
    bot = new Telegraf<ScraperBotContext>("fake-token")
  })

  it("should register middleware and commands", () => {
    // Настраиваем модуль
    setupInstagramScraperBot(bot, { enableLogging: true })

    // Проверяем, что middleware были добавлены
    expect(telegrafMocks.use).toHaveBeenCalledTimes(3)
  })

  it("should register command handlers", () => {
    // Настраиваем модуль
    setupInstagramScraperBot(bot, { enableLogging: false })

    // Проверяем, что обработчики команд были добавлены
    expect(telegrafMocks.command).toHaveBeenCalledWith(
      "scraper_projects",
      expect.any(Function)
    )
    expect(telegrafMocks.hears).toHaveBeenCalledWith(
      "📊 Управление проектами",
      expect.any(Function)
    )
  })

  it("should return menu buttons", () => {
    // Настраиваем модуль
    const scraperBot = setupInstagramScraperBot(bot)

    // Проверяем возвращаемые кнопки меню
    const buttons = scraperBot.getMenuButtons()
    expect(buttons).toEqual([
      ["📊 Управление проектами", "🔍 Скрапинг Instagram"],
    ])
  })

  it("should return commands for bot menu", () => {
    // Настраиваем модуль
    const scraperBot = setupInstagramScraperBot(bot)

    // Проверяем возвращаемые команды
    const commands = scraperBot.getCommands()
    expect(commands).toEqual([
      {
        command: "scraper_projects",
        description: "Управление проектами скрапера",
      },
    ])
  })

  it("should provide a method to enter projects scene", () => {
    // Настраиваем модуль
    const scraperBot = setupInstagramScraperBot(bot)

    // Создаем мок-контекст
    const ctx = {
      scene: {
        enter: vi.fn(),
      },
    } as unknown as ScraperBotContext

    // Вызываем метод входа в сцену
    scraperBot.enterProjectsScene(ctx)

    // Проверяем, что был выполнен вход в нужную сцену
    expect(ctx.scene.enter).toHaveBeenCalledWith("instagram_scraper_projects")
  })
})
