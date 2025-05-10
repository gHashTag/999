import { describe, it, expect, vi, beforeEach } from "vitest"
import { Scenes } from "telegraf"
import type { ScraperBotContext } from "../types"
import { competitorScene } from "../scenes/competitor-scene"
import {
  getUserByTelegramId,
  getProjectsByUserId,
  getCompetitorAccounts,
  createCompetitor,
  initializeNeonStorage,
  closeNeonStorage,
} from "../../../../agents/scraper"

// Импортируем наш модуль для тестирования
import "./setup"

// Мокируем импортированные функции для управления их поведением в тестах
const mockGetUserByTelegramId = vi.mocked(getUserByTelegramId)
const mockGetProjectsByUserId = vi.mocked(getProjectsByUserId)
const mockGetCompetitorAccounts = vi.mocked(getCompetitorAccounts)
const mockCreateCompetitor = vi.mocked(createCompetitor)
const mockInitializeNeonStorage = vi.mocked(initializeNeonStorage)
const mockCloseNeonStorage = vi.mocked(closeNeonStorage)

describe("Competitor Scene", () => {
  // Создаем мок-контекст для тестов
  let ctx: Partial<ScraperBotContext>

  beforeEach(() => {
    // Настраиваем контекст перед каждым тестом
    ctx = {
      reply: vi.fn().mockResolvedValue({}),
      answerCbQuery: vi.fn().mockResolvedValue(true),
      scene: {
        enter: vi.fn(),
        leave: vi.fn().mockResolvedValue({}),
        reenter: vi.fn().mockResolvedValue({}),
        session: {},
      },
      from: {
        id: 123456789,
        username: "test_user",
        first_name: "Test",
        last_name: "User",
      },
      storage: {
        initialize: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
        getUserByTelegramId: mockGetUserByTelegramId,
        getProjectsByUserId: mockGetProjectsByUserId,
        getCompetitorAccounts: mockGetCompetitorAccounts,
        createCompetitor: mockCreateCompetitor,
      },
    }
  })

  describe("enter handler", () => {
    it("should exit when user is not found", async () => {
      // Мокируем поведение - пользователь не найден
      mockGetUserByTelegramId.mockResolvedValueOnce(null)

      // Вызываем обработчик входа в сцену
      await competitorScene.emit("enter", ctx as ScraperBotContext)

      // Проверяем вызовы функций
      expect(initializeNeonStorage).toHaveBeenCalled()
      expect(getUserByTelegramId).toHaveBeenCalledWith(123456789)
      expect(ctx.reply).toHaveBeenCalledWith(
        "Вы не зарегистрированы. Пожалуйста, используйте /start для начала работы."
      )
      expect(ctx.scene.leave).toHaveBeenCalled()
      expect(closeNeonStorage).toHaveBeenCalled()
    })

    it("should exit when user has no projects", async () => {
      // Мокируем поведение - у пользователя нет проектов
      mockGetUserByTelegramId.mockResolvedValueOnce({
        id: 1,
        telegram_id: 123456789,
      })
      mockGetProjectsByUserId.mockResolvedValueOnce([])

      // Вызываем обработчик входа в сцену
      await competitorScene.emit("enter", ctx as ScraperBotContext)

      // Проверяем вызовы функций
      expect(initializeNeonStorage).toHaveBeenCalled()
      expect(getUserByTelegramId).toHaveBeenCalledWith(123456789)
      expect(getProjectsByUserId).toHaveBeenCalledWith(1)
      expect(ctx.reply).toHaveBeenCalledWith(
        "У вас нет проектов. Создайте проект с помощью команды /projects"
      )
      expect(ctx.scene.leave).toHaveBeenCalled()
      expect(closeNeonStorage).toHaveBeenCalled()
    })

    it("should show competitors when user has only one project", async () => {
      // Мокируем поведение - у пользователя есть один проект с конкурентами
      mockGetUserByTelegramId.mockResolvedValueOnce({
        id: 1,
        telegram_id: 123456789,
      })
      mockGetProjectsByUserId.mockResolvedValueOnce([
        { id: 1, name: "Test Project", is_active: true },
      ])
      mockGetCompetitorAccounts.mockResolvedValueOnce([
        {
          id: 1,
          username: "competitor1",
          instagram_url: "https://instagram.com/competitor1",
        },
        {
          id: 2,
          username: "competitor2",
          instagram_url: "https://instagram.com/competitor2",
        },
      ])

      // Вызываем обработчик входа в сцену
      await competitorScene.emit("enter", ctx as ScraperBotContext)

      // Проверяем вызовы функций
      expect(initializeNeonStorage).toHaveBeenCalled()
      expect(getUserByTelegramId).toHaveBeenCalledWith(123456789)
      expect(getProjectsByUserId).toHaveBeenCalledWith(1)
      expect(getCompetitorAccounts).toHaveBeenCalledWith(1)
      // Проверяем, что отображается список конкурентов
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining("Конкуренты в проекте"),
        expect.objectContaining({
          parse_mode: "Markdown",
          reply_markup: expect.anything(),
        })
      )
      expect(closeNeonStorage).toHaveBeenCalled()
    })

    it("should show add competitor option when no competitors in project", async () => {
      // Мокируем поведение - у пользователя есть проект без конкурентов
      mockGetUserByTelegramId.mockResolvedValueOnce({
        id: 1,
        telegram_id: 123456789,
      })
      mockGetProjectsByUserId.mockResolvedValueOnce([
        { id: 1, name: "Test Project", is_active: true },
      ])
      mockGetCompetitorAccounts.mockResolvedValueOnce([])

      // Вызываем обработчик входа в сцену
      await competitorScene.emit("enter", ctx as ScraperBotContext)

      // Проверяем вызовы функций
      expect(initializeNeonStorage).toHaveBeenCalled()
      expect(getUserByTelegramId).toHaveBeenCalledWith(123456789)
      expect(getProjectsByUserId).toHaveBeenCalledWith(1)
      expect(getCompetitorAccounts).toHaveBeenCalledWith(1)
      // Проверяем, что предлагается добавить конкурентов
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining("нет добавленных конкурентов"),
        expect.objectContaining({
          reply_markup: expect.anything(),
        })
      )
      expect(closeNeonStorage).toHaveBeenCalled()
    })

    it("should show project selection when user has multiple projects", async () => {
      // Мокируем поведение - у пользователя несколько проектов
      mockGetUserByTelegramId.mockResolvedValueOnce({
        id: 1,
        telegram_id: 123456789,
      })
      mockGetProjectsByUserId.mockResolvedValueOnce([
        { id: 1, name: "Project 1", is_active: true },
        { id: 2, name: "Project 2", is_active: true },
      ])

      // Вызываем обработчик входа в сцену
      await competitorScene.emit("enter", ctx as ScraperBotContext)

      // Проверяем вызовы функций
      expect(initializeNeonStorage).toHaveBeenCalled()
      expect(getUserByTelegramId).toHaveBeenCalledWith(123456789)
      expect(getProjectsByUserId).toHaveBeenCalledWith(1)
      // Проверяем, что предлагается выбрать проект
      expect(ctx.reply).toHaveBeenCalledWith(
        "Выберите проект для просмотра конкурентов:",
        expect.objectContaining({
          reply_markup: expect.anything(),
        })
      )
      expect(closeNeonStorage).toHaveBeenCalled()
    })
  })

  describe("action handlers", () => {
    it("should handle competitors_project_X action", async () => {
      // Готовим callback контекст с необходимым match
      const actionCtx = {
        ...ctx,
        match: ["competitors_project_1", "1"],
      }

      // Мокируем получение конкурентов
      mockGetCompetitorAccounts.mockResolvedValueOnce([
        {
          id: 1,
          username: "competitor1",
          instagram_url: "https://instagram.com/competitor1",
        },
      ])

      // Вызываем обработчик действия competitors_project_1
      await competitorScene.emit(
        "action",
        actionCtx as unknown as ScraperBotContext,
        "competitors_project_1"
      )

      // Проверяем вызовы функций
      expect(initializeNeonStorage).toHaveBeenCalled()
      expect(getCompetitorAccounts).toHaveBeenCalledWith(1)
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining("Конкуренты в выбранном проекте"),
        expect.objectContaining({
          parse_mode: "Markdown",
          reply_markup: expect.anything(),
        })
      )
      expect(ctx.answerCbQuery).toHaveBeenCalled()
      expect(closeNeonStorage).toHaveBeenCalled()
    })

    it("should handle add_competitor_X action", async () => {
      // Готовим callback контекст с необходимым match
      const actionCtx = {
        ...ctx,
        match: ["add_competitor_1", "1"],
      }

      // Вызываем обработчик действия add_competitor_1
      await competitorScene.emit(
        "action",
        actionCtx as unknown as ScraperBotContext,
        "add_competitor_1"
      )

      // Проверяем вызовы функций
      expect(ctx.reply).toHaveBeenCalledWith(
        "Введите Instagram URL конкурента (например, https://www.instagram.com/example):"
      )
      expect(ctx.scene.session).toHaveProperty("step")
      expect(ctx.scene.session).toHaveProperty("projectId", 1)
      expect(ctx.answerCbQuery).toHaveBeenCalled()
    })

    it("should handle exit_scene action", async () => {
      // Вызываем обработчик действия exit_scene
      await competitorScene.emit(
        "action",
        ctx as ScraperBotContext,
        "exit_scene"
      )

      // Проверяем вызовы функций
      expect(ctx.answerCbQuery).toHaveBeenCalled()
      expect(ctx.scene.leave).toHaveBeenCalled()
    })

    it("should handle back_to_projects action", async () => {
      // Вызываем обработчик действия back_to_projects
      await competitorScene.emit(
        "action",
        ctx as ScraperBotContext,
        "back_to_projects"
      )

      // Проверяем вызовы функций
      expect(ctx.answerCbQuery).toHaveBeenCalled()
      expect(ctx.scene.reenter).toHaveBeenCalled()
    })
  })

  describe("text message handler", () => {
    it("should add competitor when in ADD_COMPETITOR step with valid URL", async () => {
      // Настраиваем контекст - шаг добавления конкурента и сообщение с URL
      ctx.scene.session.step = "add_competitor"
      ctx.scene.session.projectId = 1
      ctx.message = {
        text: "https://instagram.com/competitor1",
      }

      // Мокируем функции
      mockCreateCompetitor.mockResolvedValueOnce({
        id: 3,
        username: "competitor1",
        instagram_url: "https://instagram.com/competitor1",
      })

      // Вызываем обработчик текстового сообщения
      await competitorScene.emit("text", ctx as ScraperBotContext)

      // Проверяем вызовы функций
      expect(initializeNeonStorage).toHaveBeenCalled()
      expect(ctx.storage?.createCompetitor).toHaveBeenCalledWith(
        1,
        "competitor1",
        "https://instagram.com/competitor1"
      )
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining("успешно добавлен"),
        expect.objectContaining({
          reply_markup: expect.anything(),
        })
      )
      expect(closeNeonStorage).toHaveBeenCalled()
      // Проверяем сброс шага
      expect(ctx.scene.session.step).toBeUndefined()
    })

    it("should validate Instagram URL", async () => {
      // Настраиваем контекст - шаг добавления конкурента, но неверный URL
      ctx.scene.session.step = "add_competitor"
      ctx.scene.session.projectId = 1
      ctx.message = {
        text: "not-a-valid-url",
      }

      // Вызываем обработчик текстового сообщения
      await competitorScene.emit("text", ctx as ScraperBotContext)

      // Проверяем вызовы функций - должно быть сообщение об ошибке
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining("корректный URL Instagram-аккаунта")
      )
      // Не должен сбрасывать шаг при ошибке
      expect(ctx.scene.session.step).toBe("add_competitor")
    })

    it("should handle unknown text messages", async () => {
      // Настраиваем контекст - нет активного шага
      ctx.scene.session.step = undefined
      ctx.message = {
        text: "Случайное сообщение",
      }

      // Вызываем обработчик текстового сообщения
      await competitorScene.emit("text", ctx as ScraperBotContext)

      // Проверяем сообщение о непонятной команде
      expect(ctx.reply).toHaveBeenCalledWith(
        "Я не понимаю эту команду. Используйте кнопки для управления конкурентами."
      )
    })
  })
})
