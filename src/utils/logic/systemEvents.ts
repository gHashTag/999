import EventEmitter from "events"

// Создаем и экспортируем единственный экземпляр EventEmitter для всей системы
export const systemEvents = new EventEmitter()

// Можно добавить максимальное количество слушателей, если ожидается много подписок
// systemEvents.setMaxListeners(50); // Например

console.log("System EventEmitter initialized.") // Лог для проверки инициализации
