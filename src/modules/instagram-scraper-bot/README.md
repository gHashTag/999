# Instagram Scraper Bot Module

Модуль для интеграции функционала скрапинга Instagram Reels в любой Telegram бот на базе Telegraf.js.

## Возможности

- Управление проектами скрапинга
- Управление конкурентами для мониторинга
- Управление хэштегами для мониторинга
- Запуск скрапинга Reels из аккаунтов или хэштегов
- Просмотр и взаимодействие с результатами скрапинга
- Фильтрация контента по просмотрам и дате публикации

## Установка

```bash
# Если вы используете скрипт переноса модуля в другой проект
cp -r src/modules/instagram-scraper-bot /path/to/your/project/src/modules/

# Затем установите зависимости
npm install telegraf dotenv @neondatabase/serverless
```

## Интеграция в ваш бот

```typescript
import { Telegraf } from "telegraf"
import dotenv from "dotenv"
import { setupInstagramScraperBot } from "./modules/instagram-scraper-bot"
import type { ScraperBotContext } from "./modules/instagram-scraper-bot"

// Загружаем переменные окружения
dotenv.config()

// Проверяем наличие токена
const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) {
  console.error("ОШИБКА: TELEGRAM_BOT_TOKEN не указан в переменных окружения")
  process.exit(1)
}

// Создаем инстанс бота
const bot = new Telegraf<ScraperBotContext>(token)

// Настраиваем модуль Instagram Scraper
const scraperBot = setupInstagramScraperBot(bot, {
  enableLogging: true,
  minViews: parseInt(process.env.MIN_VIEWS || "50000"),
  maxAgeDays: parseInt(process.env.MAX_AGE_DAYS || "14"),
  apifyToken: process.env.APIFY_TOKEN,
})

// Добавляем клавиатуру с кнопками модуля
bot.command("menu", ctx => {
  ctx.reply("Выберите действие:", {
    reply_markup: {
      keyboard: scraperBot.getMenuButtons(),
      resize_keyboard: true,
    },
  })
})

// Регистрируем команды для меню бота
bot.telegram.setMyCommands(scraperBot.getCommands())

// Запуск бота
bot
  .launch()
  .then(() => {
    console.log("Бот успешно запущен!")
  })
  .catch(err => {
    console.error("Ошибка при запуске бота:", err)
  })

// Обработка завершения
process.once("SIGINT", () => bot.stop("SIGINT"))
process.once("SIGTERM", () => bot.stop("SIGTERM"))
```

## Переменные окружения

Создайте файл `.env` в корне вашего проекта со следующими переменными:

```
TELEGRAM_BOT_TOKEN=ваш_токен_бота
DATABASE_URL=postgresql://user:password@hostname/database
APIFY_TOKEN=ваш_токен_apify
MIN_VIEWS=50000
MAX_AGE_DAYS=14
```

## Структура модуля

```
instagram-scraper-bot/
├── index.ts                # Основной файл модуля
├── types.ts                # Типы и интерфейсы
├── scenes/                 # Сцены для Telegraf
│   ├── project-scene.ts    # Управление проектами
│   ├── competitor-scene.ts # Управление конкурентами
│   ├── hashtag-scene.ts    # Управление хэштегами
│   └── scrape-scene.ts     # Запуск скрапинга и просмотр результатов
├── tests/                  # Тесты
│   ├── setup.ts            # Настройка окружения для тестов
│   ├── index.test.ts       # Тесты основного модуля
│   └── project-scene.test.ts # Тесты сцены проектов
└── README.md               # Документация
```

## Расширение функциональности

Модуль можно расширять, добавляя новые сцены или модифицируя существующие:

```typescript
import {
  setupInstagramScraperBot,
  projectScene,
} from "./modules/instagram-scraper-bot"

// Модифицируем существующую сцену
projectScene.command("custom", ctx => {
  ctx.reply("Моя кастомная команда")
})

// Добавляем свой middleware к сцене
projectScene.use((ctx, next) => {
  console.log("Кастомный middleware")
  return next()
})
```

## Тестирование

```bash
# Запуск всех тестов модуля
pnpm vitest run src/modules/instagram-scraper-bot

# Запуск конкретного теста
pnpm vitest run src/modules/instagram-scraper-bot/tests/index.test.ts
```

## Лицензия

MIT
