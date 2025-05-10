# Инструкции по настройке и запуску скрапера Instagram Reels

## Переменные окружения

Для работы скрапера необходимо создать файл `.env` в корне директории `src/agents/scraper` со следующим содержимым:

```env
# Neon Database URL - обязательный параметр
NEON_DATABASE_URL=postgresql://user:password@ep-example-project-123456.us-east-2.aws.neon.tech/neondb

# Neon API Key - опциональный параметр, если не используете API для управления проектами
NEON_API_KEY=your_neon_api_key

# Apify Token - обязательный параметр для работы с Apify
APIFY_API_TOKEN=your_apify_token

# Режим запуска тестов (true для полной интеграции с реальными API)
RUN_LIVE_TESTS=false
```

## Подготовка базы данных

1. Убедитесь, что у вас есть учетная запись в [Neon](https://neon.tech/) и создан проект.
2. Получите строку подключения к базе данных и вставьте её в переменную `NEON_DATABASE_URL`.
3. Запустите скрипт перестроения структуры базы данных:

```bash
cd src/agents/scraper
CONFIRM=YES bun run storage/rebuild-neon-tables.ts
```

## Получение токена Apify

1. Создайте учетную запись в [Apify](https://apify.com/).
2. Получите API токен в настройках вашего аккаунта.
3. Вставьте токен в переменную `APIFY_API_TOKEN`.

## Запуск скрапера

После настройки всех переменных окружения вы можете запустить скрапер:

```bash
cd src/agents/scraper
bun run index.ts
```

## Запуск тестов

Для запуска тестов используйте следующие команды:

```bash
# Запуск всех тестов для скрапера
cd src/agents/scraper
pnpm exec vitest run __tests__/scraper.test.ts

# Запуск тестов для хранилища Neon
pnpm exec vitest run __tests__/neon-storage.test.ts
```

Для запуска полных интеграционных тестов с реальными API установите `RUN_LIVE_TESTS=true` в файле `.env`.

## Структура базы данных

Скрапер использует следующие таблицы в базе данных Neon:

1. **ParsingSources** - источники данных для парсинга (аккаунты, хэштеги и т.д.)

   - `id` - уникальный идентификатор
   - `identifier` - идентификатор источника (URL аккаунта или хэштег)
   - `type` - тип источника (`account` или `hashtag`)
   - `is_active` - флаг активности источника
   - `last_parsed_at` - дата последнего парсинга
   - `notes` - примечания к источнику

2. **ReelsContent** - данные собранных Reels

   - `id` - уникальный идентификатор
   - `reels_url` - URL Reels (уникальное значение)
   - `publication_date` - дата публикации
   - `views_count` - количество просмотров
   - `likes_count` - количество лайков
   - `comments_count` - количество комментариев
   - `description` - описание Reels
   - `source_identifier` - идентификатор источника
   - `source_type` - тип источника
   - `author_username` - имя автора
   - `author_id` - ID автора
   - `audio_title` - название аудио
   - `audio_artist` - исполнитель аудио
   - `raw_data` - сырые данные в формате JSON
   - `parsed_at` - дата парсинга
   - `updated_at` - дата обновления

3. **ParsingLogs** - логи парсинга
   - `id` - уникальный идентификатор
   - `run_id` - UUID запуска парсинга
   - `source_id` - ID источника (внешний ключ к ParsingSources)
   - `status` - статус запуска (`success`, `error`, `partial_success`)
   - `reels_added_count` - количество добавленных Reels
   - `errors_encountered_count` - количество ошибок
   - `start_time` - время начала парсинга
   - `end_time` - время окончания парсинга
   - `log_message` - сообщение лога
