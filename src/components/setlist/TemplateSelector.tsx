'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { Template } from '@/types/database'
import { mockTemplates } from '@/lib/mockData'

interface TemplateSelectorProps {
  selectedId: number | null
  onSelect: (template: Template | null) => void
  excludeId?: number | null
}

export function TemplateSelector({ selectedId, onSelect, excludeId }: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data - substituir por chamada real ao Supabase
    const fetchTemplates = async () => {
      setLoading(true)
      // Simulando delay de rede
      await new Promise((resolve) => setTimeout(resolve, 300))
      setTemplates(mockTemplates.filter((t) => t.id !== excludeId))
      setLoading(false)
    }
    fetchTemplates()
  }, [excludeId])

  const filteredTemplates = templates.filter((t) =>
    t.nome.toLowerCase().includes(search.toLowerCase()) ||
    t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
  )

  const selectedTemplate = templates.find((t) => t.id === selectedId)

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Usar Template (opcional)
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500"
      >
        <span className={selectedTemplate ? 'text-gray-900' : 'text-gray-400'}>
          {selectedTemplate ? selectedTemplate.nome : 'Selecionar template...'}
        </span>
        <ChevronDown size={20} className="text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar templates..."
                className="w-full pl-9 pr-3 py-2 text-sm border rounded focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-60 overflow-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Carregando...</div>
            ) : filteredTemplates.length === 0 ? (
              <div className="p-4 text-center text-gray-500">Nenhum template encontrado</div>
            ) : (
              <>
                <button
                  onClick={() => {
                    onSelect(null)
                    setIsOpen(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-gray-500"
                >
                  -- Nenhum template --
                </button>
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      onSelect(template)
                      setIsOpen(false)
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                      selectedId === template.id ? 'bg-indigo-50 text-indigo-700' : ''
                    }`}
                  >
                    <div className="font-medium">{template.nome}</div>
                    {template.descricao && (
                      <div className="text-xs text-gray-500 truncate">{template.descricao}</div>
                    )}
                    <div className="flex gap-1 mt-1">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
