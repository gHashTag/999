# Документация скриптов

## Список скриптов и их назначение

### Основные скрипты
- `build-test.sh` - Сборка проекта и запуск тестов
- `deploy.sh` - Деплой приложения
- `dev-session.sh` - Запуск dev-сессии
- `kill-ports.sh` - Остановка процессов, занимающих порты
- `quality-check.sh` - Проверка качества кода
- `read-dev-logs.sh` - Чтение логов разработки
- `setup-dev.sh` - Настройка dev-окружения

### Вспомогательные скрипты
- `copy-vendor-types.mjs` - Копирование vendor типов
- `pretty-logs.mjs` - Форматирование логов
- `run-e2e-coding-flow.sh` - Запуск E2E тестов
- `send-test-event.mjs` - Отправка тестовых событий
- `test-installation.sh` - Тестирование установки

### Скрипты конфигурации
- `config/restore-snapshot.sh` - Восстановление снапшота
- `config/save-snapshot.sh` - Сохранение снапшота

## Использование chalk

Все скрипты используют библиотеку `chalk` для цветного вывода в консоль. Основные цвета:
- `chalk.green` - успешные операции
- `chalk.red` - ошибки
- `chalk.yellow` - предупреждения
- `chalk.blue` - информационные сообщения

Пример использования:
```javascript
const chalk = require('chalk');
console.log(chalk.green('Успешно!'));
console.log(chalk.red('Ошибка!'));
```