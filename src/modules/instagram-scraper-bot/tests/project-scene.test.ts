import { describe, it, expect, vi, beforeEach } from "vitest"
import { Scenes } from "telegraf"
import type { ScraperBotContext } from "../types"
import { projectScene } from "../scenes/project-scene"
import {
  getUserByTelegramId,
  getProjectsByUserId,
  createProject,
  initializeNeonStorage,
  closeNeonStorage,
} from "../../../agents/scraper"

// Импортируем наш модуль для тестирования
import "./setup"

// Мокируем импортированные функции для управления их поведением в тестах
const mockGetUserByTelegramId = vi.mocked(getUserByTelegramId)
const mockGetProjectsByUserId = vi.mocked(getProjectsByUserId)
const mockCreateProject = vi.mocked(createProject)
const mockInitializeNeonStorage = vi.mocked(initializeNeonStorage)
const mockCloseNeonStorage = vi.mocked(closeNeonStorage)

describe("Project Scene", () => {
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
    }
  })

  describe("enter handler", () => {
    it("should show projects list when user has projects", async () => {
      // Мокируем поведение - у пользователя есть проекты
      mockGetUserByTelegramId.mockResolvedValueOnce({
        id: 1,
        telegram_id: 123456789,
      })
      mockGetProjectsByUserId.mockResolvedValueOnce([
        { id: 1, name: "Project 1", is_active: true },
        { id: 2, name: "Project 2", is_active: false },
      ])

      // Вызываем обработчик входа в сцену
      await projectScene.emit("enter", ctx as ScraperBotContext)

      // Проверяем вызовы функций
      expect(initializeNeonStorage).toHaveBeenCalled()
      expect(getUserByTelegramId).toHaveBeenCalledWith(123456789)
      expect(getProjectsByUserId).toHaveBeenCalledWith(1)
      expect(ctx.reply).toHaveBeenCalledWith(
        "Ваши проекты:",
        expect.objectContaining({
          reply_markup: expect.anything(),
        })
      )
      expect(closeNeonStorage).toHaveBeenCalled()
    })

    it("should show create project option when user has no projects", async () => {
      // Мокируем поведение - у пользователя нет проектов
      mockGetUserByTelegramId.mockResolvedValueOnce({
        id: 1,
        telegram_id: 123456789,
      })
      mockGetProjectsByUserId.mockResolvedValueOnce([])

      // Вызываем обработчик входа в сцену
      await projectScene.emit("enter", ctx as ScraperBotContext)

      // Проверяем, что пользователю предложено создать проект
      expect(ctx.reply).toHaveBeenCalledWith(
        "У вас пока нет проектов. Хотите создать новый?",
        expect.objectContaining({
          reply_markup: expect.anything(),
        })
      )
    })

    it("should handle case when user is not found", async () => {
      // Мокируем поведение - пользователь не найден
      mockGetUserByTelegramId.mockResolvedValueOnce(null)

      // Вызываем обработчик входа в сцену
      await projectScene.emit("enter", ctx as ScraperBotContext)

      // Проверяем сообщение об ошибке и выход из сцены
      expect(ctx.reply).toHaveBeenCalledWith(
        "Вы не зарегистрированы. Пожалуйста, используйте сначала основные команды бота."
      )
      expect(ctx.scene.leave).toHaveBeenCalled()
    })
  })

  describe("action handlers", () => {
    it("should exit scene when exit_scene action is triggered", async () => {
      // Вызываем обработчик действия exit_scene
      await projectScene.emit("action", ctx as ScraperBotContext, "exit_scene")

      // Проверяем ответ на callback и выход из сцены
      expect(ctx.answerCbQuery).toHaveBeenCalledWith(
        "Выход из режима управления проектами"
      )
      expect(ctx.reply).toHaveBeenCalledWith(
        "Вы вышли из режима управления проектами",
        expect.objectContaining({
          reply_markup: { remove_keyboard: true },
        })
      )
      expect(ctx.scene.leave).toHaveBeenCalled()
    })

    it("should ask for project name when create_project action is triggered", async () => {
      // Вызываем обработчик действия create_project
      await projectScene.emit(
        "action",
        ctx as ScraperBotContext,
        "create_project"
      )

      // Проверяем ответ на callback и запрос имени проекта
      expect(ctx.answerCbQuery).toHaveBeenCalled()
      expect(ctx.reply).toHaveBeenCalledWith(
        "Введите название нового проекта (например, 'Мой косметологический центр'):"
      )
      // Проверяем установку шага сцены
      expect(ctx.scene.session).toHaveProperty("step")
    })

    it("should reenter scene when back_to_projects action is triggered", async () => {
      // Вызываем обработчик действия back_to_projects
      await projectScene.emit(
        "action",
        ctx as ScraperBotContext,
        "back_to_projects"
      )

      // Проверяем ответ на callback и повторный вход в сцену
      expect(ctx.answerCbQuery).toHaveBeenCalled()
      expect(ctx.scene.reenter).toHaveBeenCalled()
    })
  })

  describe("text message handler", () => {
    it("should create project when in ADD_PROJECT step", async () => {
      // Настраиваем контекст - шаг создания проекта и сообщение с названием
      ctx.scene.session.step = "add_project"
      ctx.message = {
        text: "Новый тестовый проект",
      }

      // Мокируем функции
      mockGetUserByTelegramId.mockResolvedValueOnce({
        id: 1,
        telegram_id: 123456789,
      })
      mockCreateProject.mockResolvedValueOnce({
        id: 3,
        name: "Новый тестовый проект",
        is_active: true,
      })

      // Вызываем обработчик текстового сообщения
      await projectScene.emit("text", ctx as ScraperBotContext)

      // Проверяем создание проекта и ответ
      expect(initializeNeonStorage).toHaveBeenCalled()
      expect(getUserByTelegramId).toHaveBeenCalledWith(123456789)
      expect(createProject).toHaveBeenCalledWith(1, "Новый тестовый проект")
      expect(ctx.reply).toHaveBeenCalledWith(
        'Проект "Новый тестовый проект" успешно создан!',
        expect.objectContaining({
          reply_markup: expect.anything(),
        })
      )
      expect(closeNeonStorage).toHaveBeenCalled()
      // Проверяем сброс шага
      expect(ctx.scene.session.step).toBeUndefined()
    })

    it("should validate project name length", async () => {
      // Настраиваем контекст - шаг создания проекта, но слишком короткое название
      ctx.scene.session.step = "add_project"
      ctx.message = {
        text: "AB",
      }

      // Вызываем обработчик текстового сообщения
      await projectScene.emit("text", ctx as ScraperBotContext)

      // Проверяем сообщение о валидации
      expect(ctx.reply).toHaveBeenCalledWith(
        "Название проекта должно содержать не менее 3 символов. Попробуйте еще раз:"
      )
      // Не должен сбрасывать шаг при ошибке
      expect(ctx.scene.session.step).toBe("add_project")
    })

    it("should handle unknown text messages", async () => {
      // Настраиваем контекст - нет активного шага
      ctx.scene.session.step = undefined
      ctx.message = {
        text: "Случайное сообщение",
      }

      // Вызываем обработчик текстового сообщения
      await projectScene.emit("text", ctx as ScraperBotContext)

      // Проверяем сообщение о непонятной команде
      expect(ctx.reply).toHaveBeenCalledWith(
        "Я не понимаю эту команду. Используйте кнопки для управления проектами."
      )
    })
  })
})
