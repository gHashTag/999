import { scraper } from "../index"
import dotenv from "dotenv"

dotenv.config()

async function main() {
  const apifyToken = process.env.APIFY_TOKEN
  if (!apifyToken) throw new Error("APIFY_TOKEN is required in .env")
  const reels = await scraper({ apifyToken, username: "neuro_coder", limit: 1 })
  if (!reels.length) {
    console.log("Нет данных от скрапера")
    return
  }
  const reel = reels[0]
  console.log("Первый Reel:", reel)
  console.log("Ключи:", Object.keys(reel))
}

main().catch(err => {
  console.error("Ошибка получения данных из скрапера:", err)
  process.exit(1)
})
