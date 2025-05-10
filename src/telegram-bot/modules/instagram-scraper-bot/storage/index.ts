// Экспортируем адаптеры для разных типов хранилищ
export { createNeonStorageAdapter } from "./neon-adapter"
export { createMemoryStorageAdapter } from "./memory-adapter"

// Для удобства также экспортируем фабрику по умолчанию
// В реальном приложении это бы зависело от переменных окружения
export { createMemoryStorageAdapter as createDefaultStorageAdapter } from "./memory-adapter"
