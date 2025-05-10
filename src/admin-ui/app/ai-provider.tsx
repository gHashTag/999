"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

// Определение типов
interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface AIContextType {
  messages: Message[]
  input: string
  isLoading: boolean
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: React.FormEvent) => void
}

// Создаем контекст
const AIContext = createContext<AIContextType | undefined>(undefined)

// Провайдер для оборачивания приложения
export function AIProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Я помощник по управлению скрапером Instagram Reels. Чем могу помочь?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Добавляем сообщение пользователя
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setInput("")

    try {
      // Имитация ответа от помощника
      // Здесь должен быть запрос к API
      setTimeout(() => {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Это заглушка ответа. Реальная интеграция с API будет добавлена позже.",
        }
        setMessages(prev => [...prev, botResponse])
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      console.error("Ошибка при получении ответа:", error)
      setIsLoading(false)
    }
  }

  return (
    <AIContext.Provider
      value={{
        messages,
        input,
        isLoading,
        handleInputChange,
        handleSubmit,
      }}
    >
      {children}
    </AIContext.Provider>
  )
}

// Хук для использования контекста
export function useAI() {
  const context = useContext(AIContext)
  if (context === undefined) {
    throw new Error("useAI должен использоваться внутри AIProvider")
  }
  return context
}
