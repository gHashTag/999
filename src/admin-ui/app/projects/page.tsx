import { Header } from "@/components/header"
import { Plus, Edit, Trash2 } from "lucide-react"

export default function ProjectsPage() {
  // Демо-данные для проектов
  const projects = [
    {
      id: 1,
      name: "Эстетическая Клиника",
      description: "Анализ конкурентов в сфере эстетической медицины",
      industry: "Эстетическая медицина",
      createdAt: "2023-12-15",
      active: true,
    },
    {
      id: 2,
      name: "Косметология",
      description: "Мониторинг трендов в косметологии",
      industry: "Косметология",
      createdAt: "2024-01-05",
      active: true,
    },
    {
      id: 3,
      name: "Пластическая хирургия",
      description: "Анализ контента клиник пластической хирургии",
      industry: "Пластическая хирургия",
      createdAt: "2024-02-10",
      active: false,
    },
  ]

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Проекты</h1>
            <button className="btn flex items-center">
              <Plus className="h-5 w-5 mr-1" />
              Новый проект
            </button>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Название
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Описание
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Индустрия
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата создания
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projects.map(project => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {project.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {project.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {project.industry}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {project.createdAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            project.active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {project.active ? "Активен" : "Неактивен"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button className="text-primary-600 hover:text-primary-900">
                          <Edit className="h-4 w-4 inline" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
