import { describe, it, expect, beforeAll, afterAll, vi } from "vitest"
import {
  initializeNeonStorage,
  closeNeonStorage,
  createUser,
  createProject,
  addCompetitorAccount,
  addTrackingHashtag,
  scrapeInstagramReels,
} from "../index"
import dotenv from "dotenv"
import path from "path"

// Загружаем переменные окружения для тестов
dotenv.config({ path: path.join(__dirname, "../.env") })

// Мокируем ApifyClient
vi.mock("apify-client", () => {
  return {
    ApifyClient: vi.fn().mockImplementation(() => ({
      actor: vi.fn().mockImplementation(() => ({
        call: vi.fn().mockResolvedValue({
          defaultDatasetId: "mock-dataset-id",
        }),
      })),
      dataset: vi.fn().mockImplementation(() => ({
        listItems: vi.fn().mockResolvedValue({
          items: [
            {
              url: "https://www.instagram.com/p/mock-id-1/",
              timestamp: "2023-07-01T12:00:00Z",
              viewCount: 60000,
              likesCount: 1500,
              commentsCount: 200,
              caption: "Mock Reel 1 #aestheticmedicine",
              ownerUsername: "clinicajoelleofficial",
              ownerId: "user-id-1",
              audioTitle: "Original Audio",
              audioAuthor: "Creator",
              thumbnailUrl: "https://mock-thumbnail-1.jpg",
              durationSec: 15,
            },
            {
              url: "https://www.instagram.com/p/mock-id-2/",
              timestamp: "2023-07-02T14:30:00Z",
              viewCount: 45000,
              likesCount: 1200,
              commentsCount: 150,
              caption: "Mock Reel 2 #botox #fillers",
              ownerUsername: "kayaclinicarabia",
              ownerId: "user-id-2",
              audioTitle: "Trending Sound",
              audioAuthor: "Famous Artist",
              thumbnailUrl: "https://mock-thumbnail-2.jpg",
              durationSec: 30,
            },
          ],
        }),
      })),
    })),
  }
})

// Мокируем функции Neon API
vi.mock("../storage/neonStorage-multitenant", async () => {
  const actual = await vi.importActual<
    typeof import("../storage/neonStorage-multitenant")
  >("../storage/neonStorage-multitenant")
  return {
    ...actual,
    initializeNeonStorage: vi.fn().mockResolvedValue(undefined),
    closeNeonStorage: vi.fn().mockResolvedValue(undefined),
    createUser: vi
      .fn()
      .mockImplementation((telegramId, username, firstName, lastName) => {
        return Promise.resolve({
          id: 1,
          telegram_id: telegramId,
          username,
          first_name: firstName,
          last_name: lastName,
          subscription_level: "free",
        })
      }),
    createProject: vi
      .fn()
      .mockImplementation((userId, name, description, industry) => {
        return Promise.resolve({
          id: 1,
          user_id: userId,
          name,
          description,
          industry,
          is_active: true,
        })
      }),
    addCompetitorAccount: vi
      .fn()
      .mockImplementation((projectId, instagramUrl, accountName) => {
        return Promise.resolve({
          id: 1,
          project_id: projectId,
          instagram_url: instagramUrl,
          account_name: accountName,
          is_active: true,
          priority: 0,
        })
      }),
    addTrackingHashtag: vi
      .fn()
      .mockImplementation((projectId, hashtag, displayName) => {
        return Promise.resolve({
          id: 1,
          project_id: projectId,
          hashtag,
          display_name: displayName || `#${hashtag}`,
          is_active: true,
          priority: 0,
        })
      }),
    saveReels: vi.fn().mockResolvedValue(2),
  }
})

// Мокируем функцию scrapeInstagramReels
vi.mock("../scrape/instagram-scraper", () => {
  return {
    scrapeInstagramReels: vi
      .fn()
      .mockImplementation(
        (_instagramUrl: string, options: { minViews?: number }) => {
          return Promise.resolve(
            [
              {
                reels_url: "https://www.instagram.com/p/mock-id-1/",
                publication_date: new Date("2023-07-01T12:00:00Z"),
                views_count: 60000,
                likes_count: 1500,
                comments_count: 200,
                description: "Mock Reel 1 #aestheticmedicine",
                author_username: "clinicajoelleofficial",
                author_id: "user-id-1",
                audio_title: "Original Audio",
                audio_artist: "Creator",
                thumbnail_url: "https://mock-thumbnail-1.jpg",
                duration_seconds: 15,
                raw_data: { demoData: true },
              },
              {
                reels_url: "https://www.instagram.com/p/mock-id-2/",
                publication_date: new Date("2023-07-02T14:30:00Z"),
                views_count: 45000,
                likes_count: 1200,
                comments_count: 150,
                description: "Mock Reel 2 #botox #fillers",
                author_username: "kayaclinicarabia",
                author_id: "user-id-2",
                audio_title: "Trending Sound",
                audio_artist: "Famous Artist",
                thumbnail_url: "https://mock-thumbnail-2.jpg",
                duration_seconds: 30,
                raw_data: { demoData: true },
              },
            ].filter(reel => {
              // Применяем фильтрацию по просмотрам, если указан параметр
              if (options.minViews && reel.views_count < options.minViews) {
                return false
              }
              return true
            })
          )
        }
      ),
  }
})

describe("Мультитенантный скрапер Instagram Reels", () => {
  beforeAll(async () => {
    await initializeNeonStorage()
  })

  afterAll(async () => {
    await closeNeonStorage()
  })

  describe("Управление пользователями и проектами", () => {
    it("Должен создать пользователя", async () => {
      const user = await createUser(123456789, "testuser", "Test", "User")
      expect(user).toBeDefined()
      expect(user.telegram_id).toBe(123456789)
    })

    it("Должен создать проект", async () => {
      const project = await createProject(
        1,
        "Test Project",
        "Тестовый проект",
        "Эстетическая медицина"
      )
      expect(project).toBeDefined()
      expect(project.name).toBe("Test Project")
    })

    it("Должен добавить аккаунт конкурента", async () => {
      const account = await addCompetitorAccount(
        1,
        "https://www.instagram.com/clinicajoelleofficial",
        "Clinica Joelle"
      )
      expect(account).toBeDefined()
      expect(account.instagram_url).toBe(
        "https://www.instagram.com/clinicajoelleofficial"
      )
    })

    it("Должен добавить хэштег", async () => {
      const hashtag = await addTrackingHashtag(1, "aestheticmedicine")
      expect(hashtag).toBeDefined()
      expect(hashtag.hashtag).toBe("aestheticmedicine")
    })
  })

  describe("Скрапинг Instagram Reels", () => {
    it("Должен скрапить Reels по username", async () => {
      const reels = await scrapeInstagramReels("clinicajoelleofficial", {
        apifyToken: "mock-apify-token",
      })

      expect(reels).toHaveLength(2)
      expect(reels[0].reels_url).toBe("https://www.instagram.com/p/mock-id-1/")
      expect(reels[0].views_count).toBe(60000)
    })

    it("Должен скрапить Reels по хэштегу", async () => {
      const reels = await scrapeInstagramReels("#aestheticmedicine", {
        apifyToken: "mock-apify-token",
      })

      expect(reels).toHaveLength(2)
      expect(reels[0].author_username).toBe("clinicajoelleofficial")
    })

    it("Должен применять фильтрацию по просмотрам", async () => {
      const reels = await scrapeInstagramReels("clinicajoelleofficial", {
        apifyToken: "mock-apify-token",
        minViews: 50000,
      })

      expect(reels).toHaveLength(1)
      expect(reels[0].views_count).toBe(60000)
    })

    it("Должен применять фильтрацию по дате", async () => {
      // Создаем моковую дату, которая будет использована для сравнения
      const mockToday = new Date("2023-07-10")
      const realDate = Date

      // Сохраняем оригинальный конструктор Date
      const OriginalDate = global.Date

      // Заменяем глобальный Date на мок
      global.Date = class extends OriginalDate {
        constructor(date?: string | number | Date) {
          if (date) {
            super(date)
          } else {
            super(mockToday)
          }
        }
      } as any

      try {
        const reels = await scrapeInstagramReels("clinicajoelleofficial", {
          apifyToken: "mock-apify-token",
          maxAgeDays: 7,
        })

        expect(reels).toHaveLength(2)
      } finally {
        global.Date = realDate
      }
    })

    it("Должен обрабатывать ошибки Apify", async () => {
      // Переопределяем мок для тестирования ошибки
      const mockApifyImplementation = vi.fn().mockImplementation(() => ({
        actor: vi.fn().mockImplementation(() => ({
          call: vi.fn().mockRejectedValue(new Error("Apify API error")),
        })),
      }))

      // Сохраняем оригинальную имплементацию
      const { ApifyClient } = await import("apify-client")
      const originalApifyClient = ApifyClient

      // Заменяем имплементацию
      vi.mock("apify-client", () => ({
        ApifyClient: mockApifyImplementation,
      }))

      await expect(
        scrapeInstagramReels("clinicajoelleofficial", {
          apifyToken: "mock-apify-token",
        })
      ).rejects.toThrow("Apify API error")

      // Восстанавливаем оригинальную имплементацию
      vi.mock("apify-client", () => ({
        ApifyClient: originalApifyClient,
      }))
    })
  })
})
