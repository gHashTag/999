# Запуск Instagram Reels скрапера в Docker

Этот документ содержит инструкции по запуску скрапера Instagram Reels в контейнере Docker. Это обеспечивает изолированную среду выполнения и упрощает развертывание.

## Требования

- Docker и Docker Compose
- Учетная запись Neon для базы данных
- API токен Apify

## Шаг 1: Создание Docker-файла

Создайте файл `Dockerfile` в директории `src/agents/scraper`:

```Dockerfile
FROM node:20-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем глобальные зависимости
RUN npm install -g bun typescript ts-node

# Копируем package.json и устанавливаем зависимости
COPY package.json ./
RUN bun install

# Копируем исходный код
COPY . .

# Запускаем скрапер по расписанию или в режиме демона
CMD ["bun", "run", "index.ts"]
```

## Шаг 2: Создание docker-compose.yml

Создайте файл `docker-compose.yml` в директории `src/agents/scraper`:

```yaml
version: "3"

services:
  scraper:
    build: .
    container_name: instagram-reels-scraper
    environment:
      - NEON_DATABASE_URL=your_neon_database_url_here
      - APIFY_API_TOKEN=your_apify_token_here
    volumes:
      - .:/app
      - node_modules:/app/node_modules
    restart: unless-stopped
    # Для запуска по расписанию используйте cron с соответствующими параметрами
    # или специальный контейнер-планировщик

volumes:
  node_modules:
```

## Шаг 3: Настройка переменных окружения

1. Создайте файл `.env` в директории скрапера:

```
NEON_DATABASE_URL=postgresql://user:password@ep-example-project-123456.us-east-2.aws.neon.tech/neondb
APIFY_API_TOKEN=your_apify_token
```

2. Или передайте переменные окружения через docker-compose:

```yaml
environment:
  - NEON_DATABASE_URL=postgresql://user:password@ep-example-project-123456.us-east-2.aws.neon.tech/neondb
  - APIFY_API_TOKEN=your_apify_token
```

## Шаг 4: Сборка и запуск контейнера

```bash
# Находясь в директории src/agents/scraper
docker-compose build
docker-compose up -d
```

## Шаг 5: Просмотр логов

```bash
docker-compose logs -f
```

## Запуск по расписанию

Для запуска скрапера по расписанию есть несколько вариантов:

1. **Использование Cron внутри контейнера:**
   Измените Dockerfile, добавив настройку cron и запуск скрапера по расписанию.

2. **Отдельный контейнер-планировщик:**
   Добавьте сервис с планировщиком (например, ofelia или другой контейнер cron) в docker-compose.yml.

3. **Kubernetes CronJob:**
   Если у вас есть кластер Kubernetes, используйте CronJob для запуска по расписанию.

## Советы по безопасности

1. Не храните учетные данные в файлах репозитория.
2. Используйте Docker secrets или внешние менеджеры секретов для хранения чувствительных данных.
3. Регулярно обновляйте Docker-образы и зависимости.

## Масштабирование

1. Для параллельной обработки большого количества аккаунтов/хэштегов рассмотрите возможность использования очередей сообщений (RabbitMQ, Redis) и нескольких контейнеров скрапера.
2. Добавьте мониторинг (Prometheus + Grafana) для отслеживания производительности и ошибок.

---

Для получения дополнительной информации о настройке и использовании скрапера см. `SETUP_INSTRUCTIONS.md` и `README.md`.
