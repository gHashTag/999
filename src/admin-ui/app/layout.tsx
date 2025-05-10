import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AIProvider } from "./ai-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Instagram Reels Scraper Admin",
  description: "Административная панель для скрапера Instagram Reels",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <AIProvider>{children}</AIProvider>
      </body>
    </html>
  )
}
