import { Header } from "@/components/header"
import {
  Eye,
  Heart,
  MessageCircle,
  ExternalLink,
  Star,
  Filter,
} from "lucide-react"

export default function ReelsPage() {
  // Демо-данные для списка Reels
  const reels = [
    {
      id: 1,
      url: "https://www.instagram.com/p/abcdef123456/",
      thumbnail: "https://placehold.co/300x400",
      description: "Новейшая процедура омоложения кожи с использованием...",
      views: 85000,
      likes: 3200,
      comments: 152,
      author: "clinicajoelleofficial",
      published: "2024-02-15",
      source: "competitor",
      sourceName: "Clinica Joelle",
    },
    {
      id: 2,
      url: "https://www.instagram.com/p/ghijkl789012/",
      thumbnail: "https://placehold.co/300x400",
      description: "Результаты инъекций гиалуроновой кислоты до и после...",
      views: 120000,
      likes: 5400,
      comments: 231,
      author: "kayaclinicarabia",
      published: "2024-02-10",
      source: "competitor",
      sourceName: "Kaya Clinica",
    },
    {
      id: 3,
      url: "https://www.instagram.com/p/mnopqr345678/",
      thumbnail: "https://placehold.co/300x400",
      description:
        "Популярные процедуры для губ в 2024 году #aestheticmedicine",
      views: 67000,
      likes: 2100,
      comments: 98,
      author: "lips_for_kiss",
      published: "2024-02-12",
      source: "hashtag",
      sourceName: "#aestheticmedicine",
    },
  ]

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Instagram Reels
            </h1>
            <button className="btn-secondary flex items-center">
              <Filter className="h-5 w-5 mr-1" />
              Фильтры
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reels.map(reel => (
              <div key={reel.id} className="card overflow-hidden">
                <div className="relative aspect-[9/16] bg-gray-200">
                  <img
                    src={reel.thumbnail}
                    alt={`Thumbnail for reel ${reel.id}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <div className="text-white">
                      <div className="flex items-center space-x-4 mb-2">
                        <div className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          <span>{reel.views.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center">
                          <Heart className="h-4 w-4 mr-1" />
                          <span>{reel.likes.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          <span>{reel.comments.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-xs opacity-80">
                        Опубликовано: {reel.published}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-primary-600">
                      @{reel.author}
                    </h3>
                    <button className="text-yellow-500 hover:text-yellow-600">
                      <Star className="h-5 w-5" />
                    </button>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {reel.description}
                  </p>

                  <div className="flex justify-between items-center">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        reel.source === "competitor"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {reel.sourceName}
                    </span>

                    <a
                      href={reel.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-800 flex items-center text-sm"
                    >
                      <span className="mr-1">Открыть</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <button className="btn-secondary px-8">Загрузить еще</button>
          </div>
        </div>
      </div>
    </main>
  )
}
