import { EventEmitter } from "events"
import { log } from "@/utils/logic/logger" // Import the logger

/**
 * A simple singleton event emitter for system-wide events.
 */
export class SystemEventEmitter extends EventEmitter {}

// Создаем и экспортируем единственный экземпляр EventEmitter для всей системы
export const systemEvents = new SystemEventEmitter()

// Можно добавить максимальное количество слушателей, если ожидается много подписок
// systemEvents.setMaxListeners(50); // Например

log("info", "INIT", "System EventEmitter initialized.") // Лог для проверки инициализации
