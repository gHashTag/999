console.log("Это тестовый вывод")
console.error("Это тестовая ошибка")

setTimeout(() => {
  console.log("Вывод через 1 секунду")
}, 1000)

process.on("exit", () => {
  console.log("Скрипт завершен")
})
