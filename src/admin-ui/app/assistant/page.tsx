import { Header } from "@/components/header"
import { Chat } from "@/components/chat"

export default function AssistantPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <Chat />
    </main>
  )
}
