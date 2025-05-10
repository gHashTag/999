# Instagram Scraper Bot Module для Telegram

Модуль для Telegram бота, предоставляющий функциональность для управления скрапингом Instagram Reels в нише эстетической медицины.

## Особенности

- Поиск и отслеживание Instagram Reels по аккаунтам конкурентов и хэштегам
- Фильтрация контента по просмотрам (≥ 50,000) и дате публикации (≤ 14 дней)
- Управление проектами, конкурентами и хэштегами через Telegram интерфейс
- Просмотр результатов скрапинга

## Архитектура модуля

Модуль разработан с учетом принципов инкапсуляции и изоляции. Вся бизнес-логика и зависимости находятся внутри модуля, который предоставляет простой API для интеграции с основным Telegram ботом.

### Основные компоненты

- **Сцены** (`/scenes`) - компоненты Telegraf для взаимодействия с пользователем
- **Типы** (`types.ts`) - определения всех типов данных, используемых в модуле
- **Хранилище** (`/storage`) - адаптеры для работы с разными типами хранилищ (Neon DB, Memory)
- **Компоненты** (`/scenes/components`) - общие компоненты пользовательского интерфейса

## Интеграция с Telegram ботом

Модуль предоставляет простой API для интеграции с основным Telegram ботом:

```typescript
// Импорт модуля
import {
  setupInstagramScraperBot,
  createNeonStorageAdapter,
} from "./modules/instagram-scraper-bot"

// Создание бота
const bot = new Telegraf<ScraperBotContext>(process.env.BOT_TOKEN!)

// Инициализация хранилища с подключением к Neon DB
const storageAdapter = createNeonStorageAdapter(
  process.env.NEON_CONNECTION_STRING!
)

// Настройка модуля Instagram Scraper Bot
const scraperBot = setupInstagramScraperBot(bot, storageAdapter, {
  enableLogging: true,
  minViews: 50000,
  maxAgeDays: 14,
})

// Добавление команд в меню бота
bot.telegram.setMyCommands(scraperBot.getCommands())

// Добавление кнопок в основное меню (опционально)
bot.command("menu", async ctx => {
  await ctx.reply("Выберите действие:", {
    reply_markup: {
      keyboard: scraperBot.getMenuButtons(),
      resize_keyboard: true,
    },
  })
})

// Запуск бота
bot.launch()
```

## Устройство модуля

### Абстракция хранилища данных

Модуль использует паттерн "Адаптер" для работы с различными типами хранилищ данных:

```typescript
// Использование Neon DB (PostgreSQL)
const storageAdapter = createNeonStorageAdapter(connectionString)

// Использование хранилища в памяти (для тестирования)
const memoryAdapter = createMemoryStorageAdapter()
```

### Сцены Telegraf

Все взаимодействие с пользователем происходит через сцены Telegraf:

- `project-scene.ts` - управление проектами
- `competitor-scene.ts` - управление конкурентами (аккаунтами для скрапинга)
- `hashtag-scene.ts` - управление хэштегами (будет добавлена)
- `scrape-scene.ts` - запуск и мониторинг процесса скрапинга (будет добавлена)

## Расширение модуля

Для добавления новой функциональности:

1. Определите новые типы в `types.ts` (при необходимости)
2. Добавьте новые методы в интерфейс `StorageAdapter` и реализуйте их в адаптерах
3. Создайте новую сцену в директории `/scenes`
4. Добавьте сцену в массив `stage` в `index.ts`
5. При необходимости добавьте новые команды и обработчики в `index.ts`

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

## Тестирование

```bash
# Запуск всех тестов модуля
pnpm vitest run src/modules/instagram-scraper-bot

# Запуск конкретного теста
pnpm vitest run src/modules/instagram-scraper-bot/tests/index.test.ts
```

## Лицензия

MIT
