export default function Home() {
  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Bem-vindo ao Setlist Tools
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        Gerencie seus templates e eventos musicais
      </p>
      <div className="flex justify-center gap-4">
        <a
          href="/templates"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Ver Templates
        </a>
        <a
          href="/eventos"
          className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Ver Eventos
        </a>
      </div>
    </div>
  )
}
