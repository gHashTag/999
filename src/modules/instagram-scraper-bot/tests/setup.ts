import { beforeEach, afterEach, vi } from "vitest"

// Мокируем модуль Telegraf
vi.mock("telegraf", () => {
  const Telegraf = vi.fn().mockImplementation(() => ({
    use: vi.fn(),
    launch: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
    command: vi.fn(),
    hears: vi.fn(),
    action: vi.fn(),
    on: vi.fn(),
  }))

  const Scenes = {
    BaseScene: vi.fn().mockImplementation(() => ({
      enter: vi.fn(),
      leave: vi.fn(),
      command: vi.fn(),
      action: vi.fn(),
      on: vi.fn(),
    })),
    Stage: vi.fn().mockImplementation(() => ({
      middleware: vi.fn(),
    })),
  }

  const Markup = {
    inlineKeyboard: vi.fn().mockImplementation(buttons => buttons),
    button: {
      callback: vi
        .fn()
        .mockImplementation((text, data) => ({ text, callback_data: data })),
    },
  }

  const session = vi.fn()

  return {
    Telegraf,
    Scenes,
    Markup,
    session,
  }
})

// Мокируем модуль scraper
vi.mock("../../../agents/scraper", () => ({
  initializeNeonStorage: vi.fn().mockResolvedValue(undefined),
  closeNeonStorage: vi.fn().mockResolvedValue(undefined),
  getUserByTelegramId: vi
    .fn()
    .mockResolvedValue({ id: 1, telegram_id: 123456789 }),
  createUser: vi.fn().mockResolvedValue({ id: 1, telegram_id: 123456789 }),
  getProjectsByUserId: vi
    .fn()
    .mockResolvedValue([{ id: 1, name: "Test Project", is_active: true }]),
  createProject: vi
    .fn()
    .mockResolvedValue({ id: 2, name: "New Project", is_active: true }),
  getCompetitorAccounts: vi
    .fn()
    .mockResolvedValue([
      { id: 1, instagram_url: "https://instagram.com/test", user_name: "test" },
    ]),
  getTrackingHashtags: vi
    .fn()
    .mockResolvedValue([{ id: 1, name: "beauty", is_active: true }]),
  scrapeInstagramReels: vi
    .fn()
    .mockResolvedValue([
      { reels_url: "https://instagram.com/p/123", views_count: 100000 },
    ]),
  saveReels: vi.fn().mockResolvedValue(1),
}))

// Настройка перед каждым тестом
beforeEach(() => {
  vi.clearAllMocks()
})

// Очистка после каждого теста
afterEach(() => {
  vi.resetAllMocks()
})
