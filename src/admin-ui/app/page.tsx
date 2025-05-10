import { Header } from "@/components/header"
import Link from "next/link"
import {
  BarChart,
  Instagram,
  Hash,
  Users,
  ExternalLink,
  Play,
} from "lucide-react"

export default function Home() {
  // Карточки с ключевыми метриками на дашборде
  const cards = [
    {
      title: "Проекты",
      description: "Управление проектами скрапинга",
      icon: <BarChart className="h-6 w-6 text-primary-500" />,
      href: "/projects",
    },
    {
      title: "Конкуренты",
      description: "Аккаунты конкурентов для отслеживания",
      icon: <Instagram className="h-6 w-6 text-primary-500" />,
      href: "/competitors",
    },
    {
      title: "Хэштеги",
      description: "Хэштеги для скрапинга контента",
      icon: <Hash className="h-6 w-6 text-primary-500" />,
      href: "/hashtags",
    },
    {
      title: "Пользователи",
      description: "Управление пользователями системы",
      icon: <Users className="h-6 w-6 text-primary-500" />,
      href: "/users",
    },
    {
      title: "Запустить скрапинг",
      description: "Запуск ручного или автоматического скрапинга",
      icon: <Play className="h-6 w-6 text-primary-500" />,
      href: "/scrape",
    },
    {
      title: "AI Ассистент",
      description: "Интерактивный помощник по управлению скрапером",
      icon: <ExternalLink className="h-6 w-6 text-primary-500" />,
      href: "/assistant",
    },
  ]

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Панель управления Instagram Reels Scraper
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map(card => (
              <Link key={card.title} href={card.href}>
                <div className="card hover:shadow-lg transition duration-300 flex flex-col h-full">
                  <div className="flex items-center mb-4">
                    {card.icon}
                    <h2 className="text-xl font-medium text-gray-900 ml-2">
                      {card.title}
                    </h2>
                  </div>
                  <p className="text-gray-600">{card.description}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10 card">
            <h2 className="text-xl font-medium text-gray-900 mb-4">
              Быстрые действия
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="btn">Запустить ежедневный скрапинг</button>
              <button className="btn-secondary">
                Просмотреть последние результаты
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
