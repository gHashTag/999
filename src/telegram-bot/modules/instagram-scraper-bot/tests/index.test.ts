import { Telegraf } from "telegraf"
import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  setupInstagramScraperBot,
  createMemoryStorageAdapter,
  ScraperBotContext,
} from "../"

// Типизируем мокированный бот
type MockBot = {
  use: ReturnType<typeof vi.fn>
  command: ReturnType<typeof vi.fn>
  hears: ReturnType<typeof vi.fn>
  launch: ReturnType<typeof vi.fn>
  telegram: {
    setMyCommands: ReturnType<typeof vi.fn>
  }
}

// Типизируем API модуля
type ScraperBotAPI = ReturnType<typeof setupInstagramScraperBot>

// Мокируем ответы бота для тестирования
vi.mock("telegraf", async () => {
  const actual = await vi.importActual("telegraf")

  return {
    ...actual,
    Telegraf: vi.fn().mockImplementation(() => {
      return {
        use: vi.fn(),
        command: vi.fn(),
        hears: vi.fn(),
        launch: vi.fn().mockResolvedValue(undefined),
        telegram: {
          setMyCommands: vi.fn(),
        },
      }
    }),
    Scenes: {
      Stage: vi.fn().mockImplementation(() => {
        return {
          middleware: vi.fn().mockReturnValue(() => {}),
          register: vi.fn(),
        }
      }),
      BaseScene: vi.fn().mockImplementation(() => {
        return {
          enter: vi.fn(),
          leave: vi.fn(),
          hears: vi.fn(),
          action: vi.fn(),
          on: vi.fn(),
        }
      }),
    },
  }
})

describe("Instagram Scraper Bot Module", () => {
  let bot: MockBot
  let scraperBot: ScraperBotAPI

  beforeEach(() => {
    vi.clearAllMocks()
    bot = new Telegraf("fake-token") as unknown as MockBot
    const storageAdapter = createMemoryStorageAdapter()

    scraperBot = setupInstagramScraperBot(
      bot as unknown as Telegraf<ScraperBotContext>,
      storageAdapter,
      {
        enableLogging: true,
        minViews: 10000,
        maxAgeDays: 14,
      }
    )
  })

  it("экспортирует необходимые функции и адаптеры", () => {
    expect(setupInstagramScraperBot).toBeDefined()
    expect(createMemoryStorageAdapter).toBeDefined()
  })

  it("возвращает API объект с необходимыми методами", () => {
    expect(scraperBot).toBeDefined()
    expect(scraperBot.enterProjectScene).toBeDefined()
    expect(scraperBot.enterCompetitorScene).toBeDefined()
    expect(scraperBot.getMenuButtons).toBeDefined()
    expect(scraperBot.getCommands).toBeDefined()
  })

  it("возвращает правильные кнопки меню", () => {
    const buttons = scraperBot.getMenuButtons()
    expect(buttons).toHaveLength(3) // 3 ряда кнопок
    expect(buttons[0]).toHaveLength(2) // Первый ряд: 2 кнопки
    expect(buttons[1]).toHaveLength(2) // Второй ряд: 2 кнопки
    expect(buttons[2]).toHaveLength(2) // Третий ряд: 2 кнопки

    // Проверяем наличие ключевых кнопок
    const flatButtons = buttons.flat()
    expect(flatButtons).toContain("📊 Проекты")
    expect(flatButtons).toContain("🔍 Конкуренты")
  })

  it("возвращает правильные команды", () => {
    const commands = scraperBot.getCommands()
    expect(commands).toHaveLength(5) // 5 команд

    // Проверяем наличие ключевых команд
    const commandNames = commands.map((cmd: { command: string }) => cmd.command)
    expect(commandNames).toContain("projects")
    expect(commandNames).toContain("competitors")
    expect(commandNames).toContain("hashtags")
    expect(commandNames).toContain("scrape")
    expect(commandNames).toContain("reels")
  })

  it("возвращает правильные идентификаторы сцен", () => {
    expect(scraperBot.enterProjectScene()).toBe("instagram_scraper_projects")
    expect(scraperBot.enterCompetitorScene()).toBe(
      "instagram_scraper_competitors"
    )
  })
})
