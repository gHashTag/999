import { initializeNeonStorage, closeNeonStorage } from "./storage/neonStorage"
import dotenv from "dotenv"
import path from "path"

// Загружаем переменные окружения
dotenv.config({ path: path.join(__dirname, ".env") })

console.log("Тест подключения к Neon")
console.log(
  "NEON_DATABASE_URL:",
  process.env.NEON_DATABASE_URL ? "установлен" : "не установлен"
)

async function testNeonConnection() {
  try {
    console.log("Инициализация подключения к Neon...")
    await initializeNeonStorage()
    console.log("Подключение установлено успешно!")
  } catch (error) {
    console.error("Ошибка при подключении к Neon:", error)
  } finally {
    await closeNeonStorage()
    console.log("Подключение закрыто")
  }
}

testNeonConnection().then(() => {
  console.log("Тест завершен")
})
