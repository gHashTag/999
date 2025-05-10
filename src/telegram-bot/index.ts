import { Telegraf, Markup } from "telegraf"
import { message } from "telegraf/filters"
import path from "path"
import {
  initializeNeonStorage,
  closeNeonStorage,
  getUserByTelegramId,
  createUser,
  getProjectsByUserId,
  getCompetitorAccounts,
  getTrackingHashtags,
  getReels,
  scrapeInstagramReels,
  saveReels,
} from "../agents/scraper"
import dotenv from "dotenv"

// Загружаем переменные окружения
dotenv.config()

// Инициализируем бота с токеном из переменных окружения
const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) {
  console.error("ОШИБКА: TELEGRAM_BOT_TOKEN не указан в переменных окружения")
  process.exit(1)
}
const bot = new Telegraf(token)

// Middleware для логирования
bot.use(async (ctx, next) => {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  console.log(
    `${ctx.from?.username || ctx.from?.id} - ${ctx.updateType}: ${ms}ms`
  )
})

// Обработка команды /start
bot.start(async ctx => {
  try {
    await initializeNeonStorage()

    // Получаем или создаем пользователя
    let user = await getUserByTelegramId(ctx.from.id)

    if (!user) {
      // Исправление: передаем параметры отдельно вместо объекта
      user = await createUser(
        ctx.from.id,
        ctx.from.username || undefined,
        ctx.from.first_name || undefined,
        ctx.from.last_name || undefined
      )
    }

    await closeNeonStorage()

    await ctx.reply(
      `Привет, ${ctx.from.first_name}! Я бот для скрапинга Instagram Reels в нише эстетической медицины.

Что я умею:
• Скрапить Reels по аккаунтам конкурентов 
• Фильтровать контент по просмотрам и дате
• Сохранять все в удобную базу данных

Используй команду /help чтобы узнать больше.`,
      {
        reply_markup: {
          keyboard: [
            ["🔍 Запустить скрапинг", "📊 Мои проекты"],
            ["📋 Мои конкуренты", "🏷️ Мои хэштеги"],
            ["👀 Последние Reels", "❓ Помощь"],
          ],
          resize_keyboard: true,
        },
      }
    )
  } catch (error) {
    console.error("Ошибка при обработке /start:", error)
    await ctx.reply(
      "Произошла ошибка при запуске бота. Пожалуйста, попробуйте позже."
    )
    await closeNeonStorage()
  }
})

// Обработка команды /help
bot.help(async ctx => {
  await ctx.reply(
    `*Instagram Reels Scraper Bot*
    
Команды:
• /start - Начать работу с ботом
• /projects - Список ваших проектов
• /competitors - Список конкурентов
• /hashtags - Список отслеживаемых хэштегов
• /scrape - Запустить скрапинг
• /reels - Показать последние найденные Reels
• /help - Показать эту справку

Как пользоваться:
1. Создайте проект через /projects
2. Добавьте аккаунты конкурентов и хэштеги
3. Запустите скрапинг командой /scrape
4. Просматривайте результаты через /reels`,
    { parse_mode: "Markdown" }
  )
})

// Обработка команды /projects
bot.command("projects", async ctx => {
  try {
    await initializeNeonStorage()

    const user = await getUserByTelegramId(ctx.from.id)

    if (!user) {
      await ctx.reply(
        "Вы не зарегистрированы. Используйте /start для начала работы."
      )
      await closeNeonStorage()
      return
    }

    const projects = await getProjectsByUserId(user.id)

    if (!projects || projects.length === 0) {
      await ctx.reply("У вас пока нет проектов. Хотите создать новый?", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Создать проект", callback_data: "create_project" }],
          ],
        },
      })
    } else {
      const projectButtons = projects.map(project => [
        {
          text: `${project.name} (${project.is_active ? "Активен" : "Неактивен"})`,
          callback_data: `project_${project.id}`,
        },
      ])

      projectButtons.push([
        { text: "Создать новый проект", callback_data: "create_project" },
      ])

      await ctx.reply("Ваши проекты:", {
        reply_markup: {
          inline_keyboard: projectButtons,
        },
      })
    }

    await closeNeonStorage()
  } catch (error) {
    console.error("Ошибка при получении проектов:", error)
    await ctx.reply(
      "Произошла ошибка при получении проектов. Пожалуйста, попробуйте позже."
    )
    await closeNeonStorage()
  }
})

// Обработка команды /competitors
bot.command("competitors", async ctx => {
  try {
    await initializeNeonStorage()

    const user = await getUserByTelegramId(ctx.from.id)

    if (!user) {
      await ctx.reply(
        "Вы не зарегистрированы. Используйте /start для начала работы."
      )
      await closeNeonStorage()
      return
    }

    const projects = await getProjectsByUserId(user.id)

    if (!projects || projects.length === 0) {
      await ctx.reply(
        "У вас нет проектов. Создайте проект с помощью команды /projects"
      )
      await closeNeonStorage()
      return
    }

    // Если есть только один проект, сразу показываем конкурентов
    if (projects.length === 1) {
      const competitors = await getCompetitorAccounts(projects[0].id)

      if (!competitors || competitors.length === 0) {
        await ctx.reply(
          `В проекте "${projects[0].name}" нет добавленных конкурентов. Хотите добавить?`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "Добавить конкурента",
                    callback_data: `add_competitor_${projects[0].id}`,
                  },
                ],
              ],
            },
          }
        )
      } else {
        const competitorList = competitors
          .map((c, i) => `${i + 1}. [${c.user_name}](${c.instagram_url})`)
          .join("\n")

        await ctx.reply(
          `Конкуренты в проекте "${projects[0].name}":\n\n${competitorList}`,
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "Добавить конкурента",
                    callback_data: `add_competitor_${projects[0].id}`,
                  },
                ],
              ],
            },
          }
        )
      }
    } else {
      // Если несколько проектов, просим выбрать
      const projectButtons = projects.map(project => [
        {
          text: project.name,
          callback_data: `competitors_project_${project.id}`,
        },
      ])

      await ctx.reply("Выберите проект для просмотра конкурентов:", {
        reply_markup: {
          inline_keyboard: projectButtons,
        },
      })
    }

    await closeNeonStorage()
  } catch (error) {
    console.error("Ошибка при получении конкурентов:", error)
    await ctx.reply(
      "Произошла ошибка при получении конкурентов. Пожалуйста, попробуйте позже."
    )
    await closeNeonStorage()
  }
})

// Обработка команды /hashtags
bot.command("hashtags", async ctx => {
  try {
    await initializeNeonStorage()

    const user = await getUserByTelegramId(ctx.from.id)

    if (!user) {
      await ctx.reply(
        "Вы не зарегистрированы. Используйте /start для начала работы."
      )
      await closeNeonStorage()
      return
    }

    const projects = await getProjectsByUserId(user.id)

    if (!projects || projects.length === 0) {
      await ctx.reply(
        "У вас нет проектов. Создайте проект с помощью команды /projects"
      )
      await closeNeonStorage()
      return
    }

    // Если есть только один проект, сразу показываем хэштеги
    if (projects.length === 1) {
      const hashtags = await getTrackingHashtags(projects[0].id)

      if (!hashtags || hashtags.length === 0) {
        await ctx.reply(
          `В проекте "${projects[0].name}" нет добавленных хэштегов. Хотите добавить?`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "Добавить хэштег",
                    callback_data: `add_hashtag_${projects[0].id}`,
                  },
                ],
              ],
            },
          }
        )
      } else {
        const hashtagList = hashtags
          .map((h, i) => `${i + 1}. #${h.name}`)
          .join("\n")

        await ctx.reply(
          `Хэштеги в проекте "${projects[0].name}":\n\n${hashtagList}`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "Добавить хэштег",
                    callback_data: `add_hashtag_${projects[0].id}`,
                  },
                ],
              ],
            },
          }
        )
      }
    } else {
      // Если несколько проектов, просим выбрать
      const projectButtons = projects.map(project => [
        {
          text: project.name,
          callback_data: `hashtags_project_${project.id}`,
        },
      ])

      await ctx.reply("Выберите проект для просмотра хэштегов:", {
        reply_markup: {
          inline_keyboard: projectButtons,
        },
      })
    }

    await closeNeonStorage()
  } catch (error) {
    console.error("Ошибка при получении хэштегов:", error)
    await ctx.reply(
      "Произошла ошибка при получении хэштегов. Пожалуйста, попробуйте позже."
    )
    await closeNeonStorage()
  }
})

// Обработка команды /scrape
bot.command("scrape", async ctx => {
  try {
    await initializeNeonStorage()

    const user = await getUserByTelegramId(ctx.from.id)

    if (!user) {
      await ctx.reply(
        "Вы не зарегистрированы. Используйте /start для начала работы."
      )
      await closeNeonStorage()
      return
    }

    const projects = await getProjectsByUserId(user.id)

    if (!projects || projects.length === 0) {
      await ctx.reply(
        "У вас нет проектов. Создайте проект с помощью команды /projects"
      )
      await closeNeonStorage()
      return
    }

    // Если несколько проектов, просим выбрать
    const projectButtons = projects.map(project => [
      {
        text: project.name,
        callback_data: `scrape_project_${project.id}`,
      },
    ])

    await ctx.reply("Выберите проект для скрапинга:", {
      reply_markup: {
        inline_keyboard: projectButtons,
      },
    })

    await closeNeonStorage()
  } catch (error) {
    console.error("Ошибка при подготовке к скрапингу:", error)
    await ctx.reply(
      "Произошла ошибка при подготовке к скрапингу. Пожалуйста, попробуйте позже."
    )
    await closeNeonStorage()
  }
})

// Обработка команды /reels
bot.command("reels", async ctx => {
  try {
    await initializeNeonStorage()

    const user = await getUserByTelegramId(ctx.from.id)

    if (!user) {
      await ctx.reply(
        "Вы не зарегистрированы. Используйте /start для начала работы."
      )
      await closeNeonStorage()
      return
    }

    const projects = await getProjectsByUserId(user.id)

    if (!projects || projects.length === 0) {
      await ctx.reply(
        "У вас нет проектов. Создайте проект с помощью команды /projects"
      )
      await closeNeonStorage()
      return
    }

    // Если несколько проектов, просим выбрать
    const projectButtons = projects.map(project => [
      {
        text: project.name,
        callback_data: `reels_project_${project.id}`,
      },
    ])

    await ctx.reply("Выберите проект для просмотра Reels:", {
      reply_markup: {
        inline_keyboard: projectButtons,
      },
    })

    await closeNeonStorage()
  } catch (error) {
    console.error("Ошибка при получении списка Reels:", error)
    await ctx.reply(
      "Произошла ошибка при получении списка Reels. Пожалуйста, попробуйте позже."
    )
    await closeNeonStorage()
  }
})

// Обработка кнопок меню
bot.hears("🔍 Запустить скрапинг", ctx =>
  ctx
    .reply("Запускаю скрапинг", { reply_markup: { remove_keyboard: true } })
    .then(() =>
      bot.telegram.sendMessage(ctx.chat.id, "Выберите команду:", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Скрапинг", callback_data: "run_scrape" }],
          ],
        },
      })
    )
)
bot.hears("📊 Мои проекты", ctx =>
  bot.telegram
    .sendMessage(ctx.chat.id, "Загружаю список проектов...")
    .then(() => {
      if (ctx.chat && ctx.chat.id) {
        return bot.command.projects.trigger(ctx)
      }
    })
)
bot.hears("📋 Мои конкуренты", ctx =>
  bot.telegram
    .sendMessage(ctx.chat.id, "Загружаю список конкурентов...")
    .then(() => {
      if (ctx.chat && ctx.chat.id) {
        return bot.command.competitors.trigger(ctx)
      }
    })
)
bot.hears("🏷️ Мои хэштеги", ctx =>
  bot.telegram
    .sendMessage(ctx.chat.id, "Загружаю список хэштегов...")
    .then(() => {
      if (ctx.chat && ctx.chat.id) {
        return bot.command.hashtags.trigger(ctx)
      }
    })
)
bot.hears("👀 Последние Reels", ctx =>
  bot.telegram.sendMessage(ctx.chat.id, "Загружаю Reels...").then(() => {
    if (ctx.chat && ctx.chat.id) {
      return bot.command.reels.trigger(ctx)
    }
  })
)
bot.hears("❓ Помощь", ctx =>
  bot.telegram.sendMessage(ctx.chat.id, "Загружаю справку...").then(() => {
    if (ctx.chat && ctx.chat.id) {
      return bot.command.help.trigger(ctx)
    }
  })
)

// Обработка колбэков от инлайн-кнопок
bot.action(/project_(\d+)/, async ctx => {
  const projectId = parseInt(ctx.match[1])

  try {
    await initializeNeonStorage()

    // TODO: Показать детали проекта и возможные действия

    await ctx.reply(
      `Вы выбрали проект #${projectId}. Функционал управления проектом в разработке.`
    )

    await closeNeonStorage()
  } catch (error) {
    console.error(`Ошибка при получении проекта ${projectId}:`, error)
    await ctx.reply(
      "Произошла ошибка при получении данных проекта. Пожалуйста, попробуйте позже."
    )
    await closeNeonStorage()
  }

  await ctx.answerCbQuery()
})

// Обработка выбора проекта для скрапинга
bot.action(/scrape_project_(\d+)/, async ctx => {
  const projectId = parseInt(ctx.match[1])

  try {
    await initializeNeonStorage()

    // Получаем данные о конкурентах и хэштегах
    const competitors = await getCompetitorAccounts(projectId)
    const hashtags = await getTrackingHashtags(projectId)

    if (
      (!competitors || competitors.length === 0) &&
      (!hashtags || hashtags.length === 0)
    ) {
      await ctx.reply(
        "В проекте нет добавленных конкурентов или хэштегов. Добавьте их через команды /competitors или /hashtags"
      )
      await closeNeonStorage()
      return
    }

    // Создаем кнопки для выбора источника
    const sourceButtons = []

    if (competitors && competitors.length > 0) {
      competitors.forEach(competitor => {
        sourceButtons.push([
          {
            text: `👤 ${competitor.user_name}`,
            callback_data: `scrape_competitor_${projectId}_${competitor.id}`,
          },
        ])
      })
    }

    if (hashtags && hashtags.length > 0) {
      hashtags.forEach(hashtag => {
        sourceButtons.push([
          {
            text: `#️⃣ ${hashtag.name}`,
            callback_data: `scrape_hashtag_${projectId}_${hashtag.id}`,
          },
        ])
      })
    }

    // Добавляем кнопку для скрапинга всех источников
    sourceButtons.push([
      {
        text: "🔄 Все источники",
        callback_data: `scrape_all_${projectId}`,
      },
    ])

    await ctx.reply("Выберите источник для скрапинга:", {
      reply_markup: {
        inline_keyboard: sourceButtons,
      },
    })

    await closeNeonStorage()
  } catch (error) {
    console.error(
      `Ошибка при подготовке к скрапингу проекта ${projectId}:`,
      error
    )
    await ctx.reply(
      "Произошла ошибка при подготовке к скрапингу. Пожалуйста, попробуйте позже."
    )
    await closeNeonStorage()
  }

  await ctx.answerCbQuery()
})

// Запуск скрапинга для конкретного конкурента
bot.action(/scrape_competitor_(\d+)_(\d+)/, async ctx => {
  const projectId = parseInt(ctx.match[1])
  const competitorId = parseInt(ctx.match[2])

  try {
    await initializeNeonStorage()

    const competitors = await getCompetitorAccounts(projectId)
    const competitor = competitors.find(c => c.id === competitorId)

    if (!competitor) {
      await ctx.reply("Конкурент не найден")
      await closeNeonStorage()
      return
    }

    await ctx.reply(`Начинаю скрапинг аккаунта ${competitor.user_name}...`)

    // Запускаем скрапинг
    const reels = await scrapeInstagramReels(competitor.instagram_url, {
      apifyToken: process.env.APIFY_TOKEN || "",
      minViews: parseInt(process.env.MIN_VIEWS || "50000"),
      maxAgeDays: parseInt(process.env.MAX_AGE_DAYS || "14"),
    })

    // Сохраняем результаты
    const savedCount = await saveReels(
      reels,
      projectId,
      "competitor",
      competitorId
    )

    await ctx.reply(
      `✅ Скрапинг завершен!\n\nНайдено Reels: ${reels.length}\nСохранено в базу: ${savedCount}`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Показать результаты",
                callback_data: `show_reels_${projectId}`,
              },
            ],
          ],
        },
      }
    )

    await closeNeonStorage()
  } catch (error) {
    console.error(`Ошибка при скрапинге конкурента ${competitorId}:`, error)
    await ctx.reply(
      "Произошла ошибка при скрапинге. Пожалуйста, попробуйте позже."
    )
    await closeNeonStorage()
  }

  await ctx.answerCbQuery()
})

// Запуск скрапинга для конкретного хэштега
bot.action(/scrape_hashtag_(\d+)_(\d+)/, async ctx => {
  const projectId = parseInt(ctx.match[1])
  const hashtagId = parseInt(ctx.match[2])

  try {
    await initializeNeonStorage()

    const hashtags = await getTrackingHashtags(projectId)
    const hashtag = hashtags.find(h => h.id === hashtagId)

    if (!hashtag) {
      await ctx.reply("Хэштег не найден")
      await closeNeonStorage()
      return
    }

    await ctx.reply(`Начинаю скрапинг хэштега #${hashtag.name}...`)

    // Запускаем скрапинг
    const reels = await scrapeInstagramReels(
      `https://www.instagram.com/explore/tags/${hashtag.name}/`,
      {
        apifyToken: process.env.APIFY_TOKEN || "",
        minViews: parseInt(process.env.MIN_VIEWS || "50000"),
        maxAgeDays: parseInt(process.env.MAX_AGE_DAYS || "14"),
      }
    )

    // Сохраняем результаты
    const savedCount = await saveReels(reels, projectId, "hashtag", hashtagId)

    await ctx.reply(
      `✅ Скрапинг завершен!\n\nНайдено Reels: ${reels.length}\nСохранено в базу: ${savedCount}`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Показать результаты",
                callback_data: `show_reels_${projectId}`,
              },
            ],
          ],
        },
      }
    )

    await closeNeonStorage()
  } catch (error) {
    console.error(`Ошибка при скрапинге хэштега ${hashtagId}:`, error)
    await ctx.reply(
      "Произошла ошибка при скрапинге. Пожалуйста, попробуйте позже."
    )
    await closeNeonStorage()
  }

  await ctx.answerCbQuery()
})

// Показ результатов скрапинга
bot.action(/show_reels_(\d+)/, async ctx => {
  const projectId = parseInt(ctx.match[1])

  try {
    await initializeNeonStorage()

    // Получаем последние Reels для проекта (ограничиваем 5)
    const result = await getReels(projectId, { limit: 5 })
    const reels = result.reels

    if (!reels || reels.length === 0) {
      await ctx.reply("Для выбранного проекта не найдено Reels")
    } else {
      await ctx.reply(`Найдено ${reels.length} Reels для проекта:`)

      // Отправляем информацию о каждом Reels
      for (const reel of reels) {
        await ctx.reply(
          `📱 *Instagram Reel*\n\n` +
            `👁 Просмотры: ${reel.views_count}\n` +
            `❤️ Лайки: ${reel.likes_count || "N/A"}\n` +
            `💬 Комментарии: ${reel.comments_count || "N/A"}\n` +
            `📅 Опубликовано: ${new Date(reel.publication_date).toLocaleDateString()}\n\n` +
            `${reel.description ? `Описание: ${reel.description.substring(0, 100)}${reel.description.length > 100 ? "..." : ""}\n\n` : ""}` +
            `[Открыть в Instagram](${reel.reels_url})`,
          {
            parse_mode: "Markdown",
            disable_web_page_preview: false as any,
          }
        )
      }

      await ctx.reply("Показать больше?", {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Показать еще",
                callback_data: `more_reels_${projectId}_5`,
              },
            ],
          ],
        },
      })
    }

    await closeNeonStorage()
  } catch (error) {
    console.error(
      `Ошибка при получении результатов скрапинга для проекта ${projectId}:`,
      error
    )
    await ctx.reply(
      "Произошла ошибка при получении результатов. Пожалуйста, попробуйте позже."
    )
    await closeNeonStorage()
  }

  await ctx.answerCbQuery()
})

// Обработка неизвестных сообщений
bot.on(message("text"), async ctx => {
  await ctx.reply(
    "Я не понимаю эту команду. Используйте /help для получения списка доступных команд."
  )
})

// Запуск бота
bot
  .launch()
  .then(() => {
    console.log("Бот успешно запущен!")
    console.log("Токен загружен из переменных окружения")
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
