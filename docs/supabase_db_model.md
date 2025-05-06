# Модель базы данных для анализа конкурентов и генерации контента в Instagram Reels

## Обзор

Модель базы данных разработана для поддержки анализа конкурентов и генерации контента в Instagram Reels. Она реализована с использованием Supabase, что обеспечивает масштабируемость и простоту интеграции.

## Таблицы

### 1. Конкуренты (competitors)

Эта таблица содержит информацию о конкурентах, чей контент анализируется.

```sql
CREATE TABLE competitors (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    followers_count INTEGER,
    engagement_rate FLOAT
);
```

### 2. Контент (content)

Эта таблица хранит данные о конкретных постах и Reels.

```sql
CREATE TABLE content (
    id SERIAL PRIMARY KEY,
    competitor_id INTEGER REFERENCES competitors(id),
    post_url VARCHAR(512) NOT NULL,
    likes_count INTEGER,
    comments_count INTEGER,
    views_count INTEGER
);
```

### 3. Метрики (metrics)

Эта таблица содержит агрегированные метрики для анализа.

```sql
CREATE TABLE metrics (
    id SERIAL PRIMARY KEY,
    competitor_id INTEGER REFERENCES competitors(id),
    reach INTEGER,
    engagement FLOAT
);
```

## Реализация на Supabase

1. **Создание проекта**: Создайте новый проект в Supabase.
2. **Настройка таблиц**: Используйте SQL-запросы выше для создания таблиц.
3. **Интеграция с приложением**: Используйте Supabase SDK для взаимодействия с базой данных.

## Пример использования

```javascript
const { data, error } = await supabase.from("competitors").select("*")
```

Эта модель обеспечивает гибкость и эффективность в анализе и генерации контента для Instagram Reels.
