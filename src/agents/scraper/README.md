# Мультитенантный Скрапер Instagram Reels

Скрапер для автоматического поиска, фильтрации и сохранения Instagram Reels в нише эстетической медицины с мультитенантной архитектурой.

## Возможности

- **Мультитенантность** — поддержка множества пользователей с разными проектами
- **Фильтрация контента** — по дате публикации и просмотрам
- **Гибкое хранение** — структурированное хранение в Neon Database
- **API для взаимодействия** — полный API для работы со всеми аспектами системы

## Структура проекта

- `storage/rebuild-multi-tenant-tables.ts` — скрипт для создания структуры БД
- `storage/neonStorage-multitenant.ts` — API для работы с данными
- `scripts/seed-competitors.ts` — скрипт для заполнения базы данных конкурентами и запуска скрапинга
- `MULTITENANT_STRUCTURE.md` — подробная документация по архитектуре
- `SUCCESS_HISTORY.md` — история успешных решений
- `REGRESSION_PATTERNS.md` — документация о неудачных подходах

## Настройка и использование

### Подготовка окружения

1. Создайте файл `.env` в директории `src/agents/scraper` на основе примера:

```bash
# Настройки подключения к базе данных Neon
NEON_DATABASE_URL=postgres://[username]:[password]@[host]/[database]

# API токен для Apify (необходим для скрапинга Instagram)
APIFY_TOKEN=your_apify_token_here

# ID Telegram пользователя для демонстрационного аккаунта
DEMO_USER_ID=12345678

# Настройки фильтрации контента
MIN_VIEWS=50000
MAX_DAYS_OLD=14
```

2. Установите зависимости:

```bash
bun install
```

### Инициализация базы данных

1. Создайте структуру таблиц:

```bash
bun run tsx src/agents/scraper/storage/rebuild-multi-tenant-tables.ts
```

2. Заполните базу данных конкурентами и запустите скрапинг:

```bash
bun run tsx src/agents/scraper/scripts/seed-competitors.ts
```

Этот скрипт:

- Создаст демо-пользователя и проект (если еще не существуют)
- Добавит аккаунты конкурентов, перечисленные в документации
- Запустит скрапинг с фильтрацией (не старше 14 дней, не менее 50K просмотров)
- Сохранит результаты в базу данных

## API Использование

Пример использования API в коде:

```typescript
import {
  initializeNeonStorage,
  createUser,
  createProject,
  addCompetitorAccount,
  scrapeInstagramReels,
  saveReels,
} from "./src/agents/scraper"

async function example() {
  await initializeNeonStorage()

  // Создаем пользователя
  const user = await createUser(123456789, "username", "Имя", "Фамилия")

  // Создаем проект
  const project = await createProject(
    user.id,
    "Название проекта",
    "Описание",
    "Индустрия"
  )

  // Добавляем конкурента
  await addCompetitorAccount(
    project.id,
    "https://instagram.com/competitor",
    "Competitor"
  )

  // Скрапим данные
  const reels = await scrapeInstagramReels(
    "APIFY_TOKEN",
    [{ type: "username", value: "competitor" }],
    { minViews: 50000, maxDaysOld: 14 }
  )

  // Сохраняем в базу
  await saveReels(project.id, reels, [])
}
```

## Документация

Подробная информация о мультитенантной архитектуре доступна в файле `MULTITENANT_STRUCTURE.md`.
