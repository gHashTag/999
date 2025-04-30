# 999 - Standalone NeuroCoder Agent

# 🕉️ Архитектура Агентов и Правила Проекта

**📍 Важно: Хранилище Правил**

> **Все правила проекта и подробные инструкции для каждого агента хранятся исключительно в директории `.cursor/rules/` в виде файлов `.mdc`. Эта директория – единственный источник истины для Дхармы проекта. `README.mdc` предоставляет высокоуровневый обзор и ссылки на эти файлы.**

---

Этот документ описывает высокоуровневую архитектуру агентов, их роли, зоны ответственности и связь с основными правилами (Дхармой) проекта. Сами инструкции для каждого агента находятся в соответствующих `AGENT_*.mdc` файлах.

## 🎯 Текущая Задача

Для понимания текущей цели и этапа работ смотри: [`current_task.mdc`](mdc:current_task.mdc).

## 📂 Документация скриптов

Подробная документация по скриптам проекта доступна в файле [`scripts/README.md`](scripts/README.md).

## 🧘‍♂️ Основные Агенты

## 📜 Общие Правила и Принципы

Помимо специфичных инструкций для агентов, существуют общие правила, которым должны следовать все (включая Гуру и будущих наблюдателей):

- **TDD:** Неукоснительное следование циклу "Красный -> Зеленый -> Рефакторинг".
- **Автономность:** Агенты стремятся решать задачи самостоятельно, обращаясь к Гуру только при необходимости.
- **Стиль и Паттерны:** Следование единому стилю кода и использование существующих паттернов.
- **Тестирование и Отладка:** Используй команду `bun test` и следуй ритуалу, описанному в @`testing-workflow.mdc`.
- **Git Workflow:** Работа через feature-ветки и Pull Request'ы.

Эти принципы были интегрированы в инструкции соответствующих агентов.

## 🕉️ Ритуал TDD с Помощником (`scripts/tdd-cycle.sh`)

**Проблема:** При ручном выполнении TDD-цикла легко пропустить важные шаги, такие как проверка типов (`tsc`) перед тестами или забыть запустить тесты после рефакторинга. Это приводит к накоплению ошибок, "сломанным" коммитам и болезненным регрессиям, когда новое изменение ломает старую функциональность. Время тратится на отладку проблем, которых можно было избежать.

**Решение (Дхарма):** Чтобы обеспечить чистоту кода, предотвратить регрессии и гарантировать последовательное выполнение всех шагов TDD, **ОБЯЗАТЕЛЬНО** использовать скрипт-помощник `scripts/tdd-cycle.sh` для **КАЖДОГО** цикла разработки, включающего изменение тестового файла.

**Как Использовать:**

1.  Напишите падающий тест (🔴) в соответствующем файле (`src/__tests__/...`).
2.  Запустите скрипт:
    ```bash
    bash scripts/tdd-cycle.sh <путь_к_вашему_тестовому_файлу>
    ```
3.  Следуйте инструкциям скрипта:
    *   Он проверит типы и убедится, что тест действительно падает (🔴).
    *   После написания кода реализации он будет проверять типы и запускать тест до тех пор, пока он не пройдет (🟢).
    *   После этапа рефакторинга он снова проверит типы и убедится, что тест все еще проходит (♻️).
4.  **Только после** успешного завершения скрипта можно переходить к коммиту и обновлению документации (`current_task.mdc`, `SUCCESS_HISTORY.md`, `REGRESSION_PATTERNS.md`).

**Улучшение Скрипта:** Скрипт можно и нужно улучшать по мере выявления новых краевых случаев или потребностей в автоматизации.

*Ом Шанти. Следуй ритуалу, и код твой будет чист и стабилен.* 🙏

## 💾 Управление Состоянием (State Management)

## 📜 Общие Правила и Принципы

## ⚙️ Управление Окружением Разработки

Для стабильной работы агентов в режиме разработки необходимо запустить несколько фоновых сервисов.

### Хранение типов

Все файлы с типами (*.d.ts, *type\*.ts) должны находиться исключительно в директориях `src/types` или `vendor-types`. Это способствует:

- Разделению собственных и вендорных типов
- Единой точке истины для типов
- Упрощению навигации
- Предотвращению циклических зависимостей

Для проверки выполните: `./scripts/type-location-checker.sh`

### Запуск Окружения для Тестирования Агентов (Ручной режим)

Вместо использования PM2 или сложных скриптов, для стабильной работы во время совместной разработки с AI-ассистентом рекомендуется запускать необходимые фоновые сервисы вручную в отдельных окнах терминала **с использованием `bun`**:

1.  **Окно 1: Компиляция TypeScript (Watch Mode)**

    ```bash
    bun run build:watch
    ```

    - **Назначение:** Запускает `tsc --watch --preserveWatchOutput`. Автоматически перекомпилирует `.ts` файлы в `dist/` при их изменении.

2.  **Окно 2: Inngest Dev Server**

    ```bash
    bun run dev:serve
    ```

    - **Назначение:** Запускает `inngest-cli dev`. Слушает события на `http://localhost:8288`, находит и запускает функции Inngest из работающего приложения (подключаясь к нему по URL, указанному в команде, обычно `http://localhost:8484/api/inngest`).

3.  **Окно 3: Сервер Приложения**
    ```bash
    bun run dev:start
    ```
    - **Назначение:** Запускает основной сервер приложения, который обслуживает API для Inngest (`/api/inngest`) и выполняет код функций/агентов. Пытается использовать порт 8484.

**Перед началом работы с AI:** Убедитесь, что все три команды успешно запущены в отдельных окнах и работают без ошибок.

### Использование PM2 (Альтернатива для долгосрочных процессов)

Если требуется более надежное управление фоновыми процессами, можно использовать `pm2`.

1.  **Установка (если не установлен):**
    ```bash
    npm install -g pm2
    ```
2.  **Первый Запуск / Перезапуск:**
    Остановите все текущие процессы (`pm2 delete all`) и запустите необходимые **с использованием `bun`**:

    ```bash
    # Компилятор TypeScript в режиме наблюдения
    pm2 start bun --name tsc-watch -- run build:watch

    # Inngest Dev Server (требуется для локальной разработки Inngest)
    pm2 start bun --name inngest-dev -- run dev:serve

    # Основное приложение (Сервер приложения)
    pm2 start bun --name app-server -- run dev:start
    ```

3.  **Проверка Статуса:**
    ```bash
    pm2 list
    ```
4.  **Просмотр Логов:**
    ```bash
    pm2 logs <имя_процесса>
    pm2 logs # Показать логи всех процессов
    ```
5.  **Сохранение/Восстановление:**
    ```bash
    pm2 save
    pm2 resurrect
    ```
6.  **Полная Остановка:**
    ```bash
    pm2 delete all
    ```

---

## 🏺 Сохранение и Восстановление Конфигурации ("Игла Кощея")

Чтобы избежать повторения долгих отладок, связанных с конфигурацией среды, мы используем систему снимков ключевых файлов.

### Критически Важные Файлы Конфигурации

Следующие файлы считаются критически важными для консистентности окружения и включены в снимки:

- `package.json`: Определяет зависимости проекта и скрипты.
- `bun.lockb`: Фиксирует точные версии установленных зависимостей (аналог `pnpm-lock.yaml`).
- `tsconfig.json`: Конфигурация компилятора TypeScript.
- `(vite.config.ts удален)`: Ранее использовался для Vite/Vitest, теперь конфигурация тестов управляется Bun.
- `.npmrc`: Может содержать настройки для `bun`, хотя часто не требуется. Ранее использовался для `pnpm` с `node-linker=hoisted`.

### Создание Снимка

Для сохранения текущей стабильной конфигурации используйте скрипт:

```bash
bash scripts/config/save-snapshot.sh
```

Это создаст директорию `snapshots/snapshot-YYYY-MM-DD_HH-MM-SS`, содержащую копии критически важных файлов.

### Восстановление из Снимка

Если конфигурация была нарушена или вы настраиваете проект заново, вы можете восстановить последнюю известную стабильную конфигурацию:

1.  **Найдите нужный снимок:** Посмотрите директории в `snapshots/`.
2.  **Запустите скрипт восстановления**, указав путь к директории снимка:

    ```bash
    # Замените <имя_директории_снимка> на актуальное
    bash scripts/config/restore-snapshot.sh snapshots/<имя_директории_снимка>
    ```

3.  **Переустановите зависимости:** После восстановления файлов **обязательно** выполните:
    ```bash
    bun install
    ```

---

## 🛠️ Недавние Важные Исправления (Май 2024)

Для контекста и предотвращения повторения ошибок:

- **Проблема с `zod`:** Ошибки TypeScript "Cannot find module 'zod'" были решены путем перехода на `bun`. Механизм установки зависимостей `bun` устранил эту проблему.
- **Ошибка Типов Агентов:** Ошибка `TS2352` в `src/inngest/logic/dependencyUtils.ts` была временно устранена явным приведением типов через `as unknown as Agent<TddNetworkState>`. **Требует рефакторинга:** функции `create*Agent` должны быть параметризованы типом состояния (`TddNetworkState`) для корректной типизации.
- **Переход на `bun`:** Проект полностью переведен с `pnpm` и `Vitest` на `bun` для управления зависимостями, запуска скриптов и выполнения тестов (`bun test`). Файлы конфигурации `vite.config.ts`, `vitest.config.ts`, `vitest.config.e2e.ts` были удалены.

---

## 🚀 Восстановление Окружения с Нуля

1.  **Клонируйте репозиторий:**
    ```bash
    git clone <repository_url>
    cd <repository_directory>
    ```
2.  **(Опционально) Восстановите последнюю стабильную конфигурацию:**
    - Найдите последний снимок в `snapshots/`.
    - Выполните `bash scripts/config/restore-snapshot.sh snapshots/<имя_последнего_снимка>`.
3.  **Установите зависимости:**
    ```bash
    bun install
    ```
4.  **Настройте переменные окружения:** Скопируйте `.env.example` в `.env` и заполните необходимые значения (например, API ключи).
5.  **Запустите фоновые сервисы:** Используйте ручной режим (рекомендуется для разработки с AI) или PM2, как описано в разделе "Управление Окружением Разработки".
6.  **Проверьте работоспособность:**
    ```bash
    bun run lint
    bun test
    # Попробуйте запустить тестовое событие
    ```

---

# 999

# NeuroCoder TDD Orchestration Example

This project demonstrates a standalone NeuroCoder agent using the Inngest Agent Kit, focusing on a Test-Driven Development (TDD) orchestration pattern with multiple agents (Tester, Coder, Critic).

## Overview

The goal is to create a system where a task is passed through a network of agents:

1.  **Tester:** Writes tests for the task.
2.  **Coder:** Writes implementation code based on the tests.
3.  **Critic:** Reviews both tests and code, providing feedback or approving the result.

This cycle utilizes E2B sandboxes for code execution and Inngest for managing the agent workflows and state.

## Project Structure

```
.
├── src/                # Source code
│   ├── agents/         # Agent definitions (prompts, tools, logic) (placeholder)
│   ├── tools/          # Tool definitions for agents (placeholder)
│   ├── index.ts        # Main Inngest function definition and Express server setup
│   ├── network.ts      # Definition of the TDD agent network and router
│   ├── agentDefinitions.ts # Functions to create agent instances
│   ├── toolDefinitions.ts  # Functions to create tool instances
│   ├── types.ts        # TypeScript types and interfaces
│   └── inngest/        # Inngest specific utilities (e.g., sandbox management)
├── scripts/            # Utility shell scripts
├── dist/               # Compiled JavaScript output (from TypeScript)
├── artifacts/          # Directory for downloaded E2B artifacts (.gitignore-d)
├── html/               # Directory for Vitest HTML report output (.gitignore-d)
├── .env.example        # Example environment variables
├── package.json        # Project dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── vitest.config.ts    # Vitest configuration
├── README.md           # This file
└── ROADMAP.md          # Detailed plan and progress tracking
```

## Правила синхронизации и обновления

### Механизмы синхронизации:

- **launchd**: Автоматический запуск скриптов обновления по расписанию
- **rsync**: Синхронизация конфигурационных файлов между узлами

### Директории конфигурации:

- `/Users/playra/999/.cursor/rules` - Основные правила проекта
- `/Users/playra/999/scripts` - Скрипты обновления

### Проверка статуса:

```bash
launchctl list | grep 999
rsync --dry-run -avn /Users/playra/999/.cursor/rules/ destination:/path/
```

### Обновление конфигурации:

```bash
bash /Users/playra/999/scripts/update-config.sh
```

## Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```
2.  **Install dependencies:** Requires Node.js and pnpm.
    ```bash
    pnpm install
    ```
3.  **Configure Environment Variables:**
    - Copy `.env.example` to `.env`.
    - Fill in your `E2B_API_KEY` and `DEEPSEEK_API_KEY`. You might need to adjust `DEEPSEEK_MODEL` if you prefer a different DeepSeek model.
    ```bash
    cp .env.example .env
    # Edit .env with your keys
    ```
4.  **Setup Git Hooks (Optional but Recommended):**
    ```bash
    pnpm prepare
    # or directly: npx husky install
    ```

## Development Environment

The primary command for local development is:

```bash
pnpm run dev
```

This command performs several actions using `concurrently`:

1.  **Cleans Ports:** Runs `scripts/kill-ports.sh` to free up potentially conflicting ports (8288, 8289, 4173, 3000, 5000, 8484).
2.  **Build Watch:** Runs `tsc --watch` to continuously compile TypeScript files into the `dist/` directory.
3.  **Inngest Dev Server:** Runs `npx inngest-cli dev -u http://localhost:8484/api/inngest`. This is the core Inngest development server that listens for events and triggers function runs. It connects to the application server running on port 8484.
4.  **Test Report Server:** Runs `npx vite preview --outDir html` to serve the Vitest HTML coverage report (usually accessible at `http://localhost:4173`).

**Important Notes:**

- The `dev` script **does not** run `node dist/index.js` directly anymore. The `inngest-cli dev` server handles the execution of Inngest functions defined in `dist/index.js`.
- The `--raw` flag is passed to `concurrently` to preserve color output from the individual processes.

**Troubleshooting:**

- **Port Conflicts (`EADDRINUSE`):** If `pnpm run dev` fails due to port conflicts even after the `kill-ports.sh` script, some processes might not have terminated correctly. You can manually kill them using `pkill`. Open a separate terminal and run:
  ```bash
  # Stop all related dev processes forcefully
  pkill -f 'pnpm run dev' && pkill -f 'inngest-cli dev' && pkill -f 'vite preview' && pkill -f 'tsc --watch' && pkill -f 'nodemon'
  # Run this command a couple of times if needed, then try 'pnpm run dev' again.
  ```
- **Stale Commands/Behavior:** If `pnpm run dev` seems to be running an old version of the script (e.g., still trying to launch `nodemon`), try cleaning the pnpm cache:
  ```bash
  pnpm store prune
  ```
  If that doesn't work, try a full reinstall:
  ```bash
  rm -rf node_modules
  pnpm install
  ```
  Then, use the `pkill` command above before running `pnpm run dev` again.

## Sending Test Events

To trigger the `coding-agent/run` function during development, use the provided script:

```bash
# Ensure 'pnpm run dev' is running in another terminal

# Send event with default task
node scripts/send-test-event.mjs

# Send event with a custom task string
node scripts/send-test-event.mjs "Implement a function that calculates Fibonacci sequence"

# Send event with custom JSON data (pass as a single string argument)
node scripts/send-test-event.mjs '{"input": "Refactor this code to use async/await", "context": "some existing code..."}'
```

## Running Tests

- **Run all tests once:** `pnpm test`
- **Run tests in watch mode with UI and coverage:** `pnpm run test:watch` (Access UI typically at `http://localhost:51204/__vitest__/`)
- **Generate coverage report:** `pnpm run coverage` (HTML report available in `html/` directory, view with `pnpm run dev:test-report`)

## Linting and Formatting

- **Check formatting:** `pnpm run format:check`
- **Apply formatting:** `pnpm run format`
- **Check linting:** `pnpm run lint`
- **Apply linting fixes:** `pnpm run lint:fix`

These checks are also run automatically on staged files before committing if you've set up Husky hooks (`pnpm prepare`).

## Building for Production

```bash
pnpm run build
```

This compiles TypeScript code to the `dist/` directory.

## Starting in Production Mode

```bash
node dist/index.js
```

This starts the Express server which serves the Inngest functions. Ensure necessary environment variables are set.

## Development Notes

### Node.js ES Modules and File Extensions

This project uses native ES Modules (ESM) configured via `"type": "module"` in `package.json` and compiled with TypeScript (`tsc`).

**Problem:** Node.js, when running ESM code, requires **explicit file extensions** for relative imports (e.g., `.js`). It does not automatically resolve extensions like `.ts` or look for `index.js` within directories as CommonJS did.

**Symptom:** Running the compiled code (e.g., `node dist/index.js`) results in `ERR_MODULE_NOT_FOUND` or `ERR_UNSUPPORTED_DIR_IMPORT` errors for relative paths.

**Solution:** You **MUST** include the `.js` extension in all relative import/export paths within the TypeScript source code (`.ts` files).

```typescript
// Incorrect (causes runtime error in Node.js ESM)
import { something } from "./my-module"
import { helper } from "../utils/helpers"
export * from "./logic/service"

// Correct (works after tsc compilation)
import { something } from "./my-module.js"
import { helper } from "../utils/helpers.js"
export * from "./logic/service.js"
```

**Why?**

- `tsc` (with current settings like `moduleResolution: "bundler"` or even `"NodeNext"`) does not automatically append `.js` extensions to relative paths in the compiled JavaScript output.
- Node.js strictly follows the ESM specification, which mandates explicit extensions for relative paths to avoid ambiguity and align with browser behavior.

**Alternatives (Not Recommended):**

- Using `--experimental-specifier-resolution=node`: Relies on an experimental Node.js flag.
- Using Bundlers (Vite, esbuild): Adds complexity but can handle resolution automatically (potential future improvement).

**Current Practice:** Manually add `.js` to all relative imports/exports in `.ts` files.

### Common Testing Issues & Solutions

## Запуск Окружения для Тестирования Агентов (Ручной режим)

Вместо использования PM2 или сложных скриптов, для стабильной работы во время совместной разработки с AI-ассистентом рекомендуется запускать необходимые фоновые сервисы вручную в отдельных окнах терминала:

1.  **Окно 1: Компиляция TypeScript (Watch Mode)**

    ```bash
    pnpm run build:watch
    ```

    - **Назначение:** Запускает `tsc --watch --preserveWatchOutput`. Автоматически перекомпилирует `.ts` файлы в `dist/` при их изменении.

2.  **Окно 2: Inngest Dev Server**

    ```bash
    pnpm run dev:serve
    ```

    - **Назначение:** Запускает `inngest-cli dev`. Слушает события на `http://localhost:8288`, находит и запускает функции Inngest из работающего приложения (подключаясь к нему по URL, указанному в команде, обычно `http://localhost:8484/api/inngest`).

3.  **Окно 3: Сервер Приложения (Vite)**
    ```bash
    pnpm run dev:start
    ```
    - **Назначение:** Запускает `vite --port 8484`. Основной сервер, который обслуживает API для Inngest (`/api/inngest`) и выполняет код функций/агентов. Пытается использовать порт 8484.

**Перед началом работы с AI:** Убедитесь, что все три команды успешно запущены в отдельных окнах и работают без ошибок.

## ⚙️ Управление Окружением Разработки (PM2)

Для стабильной работы агентов в режиме разработки необходимо запустить несколько фоновых сервисов. Рекомендуется использовать `pm2` для управления ими.

1.  **Установка (если не установлен):**
    ```bash
    npm install -g pm2
    ```
2.  **Первый Запуск / Перезапуск:**
    Остановите все текущие процессы (`pm2 delete all`) и запустите необходимые:

    ```bash
    # Компилятор TypeScript в режиме наблюдения
    pm2 start pnpm --name tsc-watch -- run dev:watch

    # Inngest Dev Server (требуется для локальной разработки Inngest)
    pm2 start pnpm --name inngest-dev -- run dev:inngest

    # Основное приложение (Vite сервер)
    pm2 start pnpm --name vite-app -- run dev:start
    ```

3.  **Проверка Статуса:**
    ```bash
    pm2 list
    ```
    Убедитесь, что все три процесса (`tsc-watch`, `inngest-dev`, `vite-app`) имеют статус `online`.
4.  **Просмотр Логов:**
    ```bash
    pm2 logs <имя_процесса> # например, pm2 logs tsc-watch
    pm2 logs # Показать логи всех процессов
    ```
5.  **Сохранение Конфигурации:**
    После успешного запуска всех процессов сохраните их список:
    ```bash
    pm2 save
    ```
    Это позволит восстановить их позже.
6.  **Восстановление Конфигурации:**
    После перезагрузки машины или если процессы были остановлены:
    ```bash
    pm2 resurrect
    ```
7.  **Полная Остановка:**
    ```bash
    pm2 delete all
    ```

**Важно:** Для максимальной стабильности рекомендуется запускать эти `pm2 start` команды в **отдельном терминале**, а не через AI ассистента, так как сессия ассистента может прерываться.

---
