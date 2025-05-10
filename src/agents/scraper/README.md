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
- `MULTITENANT_STRUCTURE.md` — подробная документация по архитектуре
- `SUCCESS_HISTORY.md` — история успешных решений
- `REGRESSION_PATTERNS.md` — документация о неудачных подходах
- `competitor_urls.json` — список URL аккаунтов конкурентов

## Начало работы

1. Настроить переменные окружения в `.env`:

   ```
   NEON_DATABASE_URL=postgres://...
   APIFY_TOKEN=apify_api_...
   ```

2. Создать структуру базы данных:

   ```bash
   CONFIRM=YES node storage/rebuild-multi-tenant-tables.ts
   ```

3. Использовать API для работы с данными:

   ```typescript
   import {
     initializeNeonStorage,
     createUser,
     createProject,
     addCompetitorAccount,
     saveReels,
   } from "./storage/neonStorage-multitenant"

   // Инициализация и использование API
   // См. примеры в MULTITENANT_STRUCTURE.md
   ```

## Документация

Подробная информация о мультитенантной архитектуре доступна в файле `MULTITENANT_STRUCTURE.md`.
