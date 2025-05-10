import { Scenes } from "telegraf"
import {
  initializeNeonStorage,
  closeNeonStorage,
  getProjectsByUserId,
  getUserByTelegramId,
  createProject,
} from "../../../agents/scraper"
import { ScraperBotContext, ScraperSceneStep } from "../types"
import {
  generateProjectsKeyboard,
  generateProjectMenuKeyboard,
  generateNewProjectKeyboard,
} from "./components/project-keyboard"

/**
 * Сцена для управления проектами
 */
export const projectScene = new Scenes.BaseScene<ScraperBotContext>(
  "instagram_scraper_projects"
)

// Вход в сцену - показываем список проектов
projectScene.enter(async ctx => {
  try {
    await initializeNeonStorage()

    const user = await getUserByTelegramId(ctx.from?.id || 0)

    if (!user) {
      await ctx.reply(
        "Вы не зарегистрированы. Пожалуйста, используйте сначала основные команды бота."
      )
      return await ctx.scene.leave()
    }

    const projects = await getProjectsByUserId(user.id)

    await ctx.reply(
      projects && projects.length > 0
        ? "Ваши проекты:"
        : "У вас пока нет проектов. Хотите создать новый?",
      {
        reply_markup: generateProjectsKeyboard(projects),
      }
    )

    await closeNeonStorage()
  } catch (error) {
    console.error("Ошибка при получении проектов:", error)
    await ctx.reply(
      "Произошла ошибка при получении проектов. Пожалуйста, попробуйте позже."
    )
    await closeNeonStorage()
    await ctx.scene.leave()
  }
})

// Обработка выхода из сцены
projectScene.action("exit_scene", async ctx => {
  await ctx.answerCbQuery("Выход из режима управления проектами")
  await ctx.reply("Вы вышли из режима управления проектами", {
    reply_markup: { remove_keyboard: true },
  })
  return await ctx.scene.leave()
})

// Обработка создания нового проекта
projectScene.action("create_project", async ctx => {
  await ctx.answerCbQuery()
  await ctx.reply(
    "Введите название нового проекта (например, 'Мой косметологический центр'):"
  )
  // Устанавливаем следующий шаг - ожидание ввода названия проекта
  ctx.scene.session.step = ScraperSceneStep.ADD_PROJECT
})

// Обработка текстовых сообщений
projectScene.on("text", async ctx => {
  // Обработка шага создания проекта
  if (ctx.scene.session.step === ScraperSceneStep.ADD_PROJECT) {
    try {
      await initializeNeonStorage()

      const user = await getUserByTelegramId(ctx.from.id)
      if (!user) {
        await ctx.reply("Ошибка: пользователь не найден.")
        await closeNeonStorage()
        return await ctx.scene.leave()
      }

      const projectName = ctx.message.text.trim()
      if (projectName.length < 3) {
        await ctx.reply(
          "Название проекта должно содержать не менее 3 символов. Попробуйте еще раз:"
        )
        return
      }

      const project = await createProject(user.id, projectName)

      await ctx.reply(`Проект "${projectName}" успешно создан!`, {
        reply_markup: generateNewProjectKeyboard(project.id),
      })

      // Сбрасываем шаг
      ctx.scene.session.step = undefined
      await closeNeonStorage()
    } catch (error) {
      console.error("Ошибка при создании проекта:", error)
      await ctx.reply(
        "Произошла ошибка при создании проекта. Пожалуйста, попробуйте позже."
      )
      await closeNeonStorage()
    }
  } else {
    await ctx.reply(
      "Я не понимаю эту команду. Используйте кнопки для управления проектами."
    )
  }
})

// Обработка возврата к списку проектов
projectScene.action("back_to_projects", async ctx => {
  await ctx.answerCbQuery()
  return await ctx.scene.reenter()
})

// Обработка выбора проекта
projectScene.action(/project_(\d+)/, async ctx => {
  const projectId = parseInt(ctx.match[1])
  await ctx.answerCbQuery()

  try {
    await initializeNeonStorage()
    // Здесь можно загрузить детали проекта и показать меню управления

    await ctx.reply(`Проект #${projectId}. Выберите действие:`, {
      reply_markup: generateProjectMenuKeyboard(projectId),
    })

    await closeNeonStorage()
  } catch (error) {
    console.error(`Ошибка при получении проекта ${projectId}:`, error)
    await ctx.reply(
      "Произошла ошибка при получении данных проекта. Пожалуйста, попробуйте позже."
    )
    await closeNeonStorage()
  }
})

// Добавить другие обработчики для действий add_competitor, add_hashtag, scrape_project и т.д.

export default projectScene
