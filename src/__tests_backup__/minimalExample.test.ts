import { describe, it, expect, beforeAll } from "vitest"
import { InngestTestEngine } from "@inngest/test"
import { minimalFunction } from "@/inngest/minimalExample" // Используем alias для импорта

describe("Minimal Function Test", () => {
  let t: InngestTestEngine

  beforeAll(() => {
    // Передаем реальную функцию в конструктор
    t = new InngestTestEngine({ function: minimalFunction })
  })

  it("should process event data and return success message", async () => {
    const eventData = { message: "Hello Minimal Test" }

    // Используем t.execute для запуска функции
    // Мокируем входное событие через опцию 'events'
    const { result, error } = await t.execute({
      events: [
        {
          name: "test/minimal.event", // Имя события, на которое триггерится функция
          data: eventData,
        },
      ],
      // Мокируем шаг 'simple-step' через опцию 'steps'
      // Handler здесь просто возвращает ожидаемый результат этого шага
      steps: [
        {
          id: "simple-step",
          handler() {
            // Не выполняем реальную логику шага, а возвращаем то,
            // что функция ожидает получить от этого шага
            return `Processed: ${eventData.message}`
          },
        },
      ],
    })

    // Проверяем, что ошибки не было
    expect(error).toBeUndefined()

    // Проверяем, что функция вернула ожидаемый результат
    const resultTyped = result as { success: boolean; finalMessage: string }
    expect(resultTyped).toBeDefined()
    expect(resultTyped?.success).toBe(true)
    expect(resultTyped?.finalMessage).toBe(`Processed: ${eventData.message}`)

    // Можно добавить проверки вызова шагов, если нужно, но пока ограничимся результатом
  })
})
