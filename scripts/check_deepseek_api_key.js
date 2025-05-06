// Простой скрипт для проверки API-ключа DeepSeek

// Загружаем переменные окружения из файла .env
import { config } from "dotenv"
config({ path: "/Users/playra/999/.env" })

// Выводим API-ключ для отладки (замаскированный)
console.log(
  "Loaded DeepSeek API Key from .env:",
  process.env.DEEPSEEK_API_KEY ? "****-key (loaded)" : "not loaded"
)

// Функция для проверки API-ключа DeepSeek
async function checkDeepSeekApiKey() {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    console.error("Ошибка: API-ключ DeepSeek не загружен из .env")
    return false
  }

  try {
    console.log("Проверяю API-ключ DeepSeek...")
    // Выполняем тестовый запрос к API DeepSeek
    const response = await fetch("https://api.deepseek.com/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (response.ok) {
      const data = await response.json()
      console.log("API-ключ действителен! Ответ от DeepSeek API:", data)
      return true
    } else {
      console.error("Ошибка при проверке API-ключа. Статус:", response.status)
      console.error("Текст ошибки:", await response.text())
      return false
    }
  } catch (error) {
    console.error("Исключение при проверке API-ключа:", error.message)
    return false
  }
}

// Запускаем проверку
checkDeepSeekApiKey().then(isValid => {
  console.log(
    "Результат проверки API-ключа DeepSeek:",
    isValid ? "Действителен" : "Недействителен"
  )
})
