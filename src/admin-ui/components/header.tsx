"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Instagram } from "lucide-react"

const navigation = [
  { name: "Дашборд", href: "/" },
  { name: "Проекты", href: "/projects" },
  { name: "Конкуренты", href: "/competitors" },
  { name: "Хэштеги", href: "/hashtags" },
  { name: "Reels", href: "/reels" },
  { name: "Статистика", href: "/stats" },
  { name: "AI Ассистент", href: "/assistant" },
]

export function Header() {
  const pathname = usePathname()

  return (
    <header className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Instagram className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-semibold text-gray-900">
                Instagram Reels Scraper
              </span>
            </div>
            <nav className="ml-6 flex space-x-4">
              {navigation.map(item => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    pathname === item.href
                      ? "border-b-2 border-primary-500 text-primary-600"
                      : "border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  )
}
