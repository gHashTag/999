"use client"

import { useEffect, useRef, useState } from "react"
import { useAI } from "@/app/ai-provider"
import { Send, Loader2 } from "lucide-react"

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useAI()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Автопрокрутка при новых сообщениях
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  message.role === "user"
                    ? "bg-primary-600 text-white"
                    : "bg-white border border-gray-200"
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t p-4 bg-white">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Спросите что-нибудь или введите команду..."
              className="flex-1 input"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="btn !px-3 !py-2"
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
