"use client"

import { createAI } from "ai"
import { submitUserMessage } from "./actions"

// Создаем AI провайдер
export const AI = createAI({
  actions: {
    submitUserMessage,
  },
  initialAIState: {
    role: "assistant",
    content:
      "Я помощник по управлению скрапером Instagram Reels. Чем могу помочь?",
  },
  initialUIState: {
    messageHistory: [],
    input: "",
  },
})

// Провайдер для оборачивания приложения
export function AIProvider({ children }: { children: React.ReactNode }) {
  return <AI.Provider>{children}</AI.Provider>
}
