import { describe, it, expect, vi } from "vitest"
import {
  generateProjectsKeyboard,
  generateProjectMenuKeyboard,
  generateNewProjectKeyboard,
} from "../scenes/components/project-keyboard"
import { Markup } from "telegraf"

// Мокируем Markup из telegraf
vi.mock("telegraf", () => {
  return {
    Markup: {
      inlineKeyboard: vi.fn(buttons => ({
        reply_markup: { inline_keyboard: buttons },
      })),
      button: {
        callback: vi.fn((text, data) => ({
          text,
          callback_data: data,
        })),
      },
    },
  }
})

describe("Project Keyboard Components", () => {
  describe("generateProjectsKeyboard", () => {
    it("should generate correct keyboard for empty projects list", () => {
      const keyboard = generateProjectsKeyboard([])

      // Проверяем, что клавиатура содержит только кнопки создания проекта и выхода
      expect(keyboard.reply_markup.inline_keyboard).toHaveLength(2)

      // Проверяем первую строку (создать проект)
      expect(keyboard.reply_markup.inline_keyboard[0][0].text).toBe(
        "Создать проект"
      )
      expect(keyboard.reply_markup.inline_keyboard[0][0].callback_data).toBe(
        "create_project"
      )

      // Проверяем вторую строку (выход)
      expect(keyboard.reply_markup.inline_keyboard[1][0].text).toBe("Выйти")
      expect(keyboard.reply_markup.inline_keyboard[1][0].callback_data).toBe(
        "exit_scene"
      )
    })

    it("should generate correct keyboard for projects list", () => {
      const projects = [
        { id: 1, name: "Project 1", is_active: true },
        { id: 2, name: "Project 2", is_active: false },
      ]

      const keyboard = generateProjectsKeyboard(projects)

      // Проверяем, что клавиатура содержит строки для проектов + строки для создания и выхода
      expect(keyboard.reply_markup.inline_keyboard).toHaveLength(4)

      // Проверяем строки проектов
      expect(keyboard.reply_markup.inline_keyboard[0][0].text).toBe(
        "Project 1 (Активен)"
      )
      expect(keyboard.reply_markup.inline_keyboard[0][0].callback_data).toBe(
        "project_1"
      )

      expect(keyboard.reply_markup.inline_keyboard[1][0].text).toBe(
        "Project 2 (Неактивен)"
      )
      expect(keyboard.reply_markup.inline_keyboard[1][0].callback_data).toBe(
        "project_2"
      )

      // Проверяем строку создания проекта
      expect(keyboard.reply_markup.inline_keyboard[2][0].text).toBe(
        "Создать новый проект"
      )
      expect(keyboard.reply_markup.inline_keyboard[2][0].callback_data).toBe(
        "create_project"
      )

      // Проверяем строку выхода
      expect(keyboard.reply_markup.inline_keyboard[3][0].text).toBe("Выйти")
      expect(keyboard.reply_markup.inline_keyboard[3][0].callback_data).toBe(
        "exit_scene"
      )
    })
  })

  describe("generateProjectMenuKeyboard", () => {
    it("should generate correct menu keyboard for a project", () => {
      const projectId = 5
      const keyboard = generateProjectMenuKeyboard(projectId)

      // Проверяем, что клавиатура содержит 5 строк действий
      expect(keyboard.reply_markup.inline_keyboard).toHaveLength(5)

      // Проверяем кнопку добавления конкурента
      expect(keyboard.reply_markup.inline_keyboard[0][0].text).toBe(
        "Добавить конкурента"
      )
      expect(keyboard.reply_markup.inline_keyboard[0][0].callback_data).toBe(
        "add_competitor_5"
      )

      // Проверяем кнопку добавления хэштега
      expect(keyboard.reply_markup.inline_keyboard[1][0].text).toBe(
        "Добавить хэштег"
      )
      expect(keyboard.reply_markup.inline_keyboard[1][0].callback_data).toBe(
        "add_hashtag_5"
      )

      // Проверяем кнопку запуска скрапинга
      expect(keyboard.reply_markup.inline_keyboard[2][0].text).toBe(
        "Запустить скрапинг"
      )
      expect(keyboard.reply_markup.inline_keyboard[2][0].callback_data).toBe(
        "scrape_project_5"
      )

      // Проверяем кнопку просмотра Reels
      expect(keyboard.reply_markup.inline_keyboard[3][0].text).toBe(
        "Просмотреть Reels"
      )
      expect(keyboard.reply_markup.inline_keyboard[3][0].callback_data).toBe(
        "show_reels_5"
      )

      // Проверяем кнопку возврата к проектам
      expect(keyboard.reply_markup.inline_keyboard[4][0].text).toBe(
        "Назад к проектам"
      )
      expect(keyboard.reply_markup.inline_keyboard[4][0].callback_data).toBe(
        "back_to_projects"
      )
    })
  })

  describe("generateNewProjectKeyboard", () => {
    it("should generate correct keyboard after project creation", () => {
      const projectId = 7
      const keyboard = generateNewProjectKeyboard(projectId)

      // Проверяем, что клавиатура содержит 3 строки действий
      expect(keyboard.reply_markup.inline_keyboard).toHaveLength(3)

      // Проверяем кнопку перехода к списку проектов
      expect(keyboard.reply_markup.inline_keyboard[0][0].text).toBe(
        "К списку проектов"
      )
      expect(keyboard.reply_markup.inline_keyboard[0][0].callback_data).toBe(
        "back_to_projects"
      )

      // Проверяем кнопку добавления конкурента
      expect(keyboard.reply_markup.inline_keyboard[1][0].text).toBe(
        "Добавить конкурента"
      )
      expect(keyboard.reply_markup.inline_keyboard[1][0].callback_data).toBe(
        "add_competitor_7"
      )

      // Проверяем кнопку добавления хэштега
      expect(keyboard.reply_markup.inline_keyboard[2][0].text).toBe(
        "Добавить хэштег"
      )
      expect(keyboard.reply_markup.inline_keyboard[2][0].callback_data).toBe(
        "add_hashtag_7"
      )
    })
  })
})
