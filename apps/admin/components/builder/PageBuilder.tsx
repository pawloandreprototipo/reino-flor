'use client'

import { useState } from 'react'
import { Monitor, Smartphone, ExternalLink, Save } from 'lucide-react'
import { useBuilder } from '@/hooks/useBuilder'
import { SectionPanel } from './SectionPanel'
import { BuilderCanvas } from './BuilderCanvas'
import { PropsEditor } from './PropsEditor'
import { SectionPreview } from './SectionPreview'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/Button'

type ViewMode = 'canvas' | 'preview'
type DeviceMode = 'desktop' | 'mobile'

export function PageBuilder() {
  const {
    sections,
    isLoading,
    isSaving,
    selectedId,
    selectedSection,
    setSelectedId,
    addSection,
    removeSection,
    updateSection,
    reorderSections,
    duplicateSection,
  } = useBuilder('home')

  const [viewMode, setViewMode] = useState<ViewMode>('canvas')
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop')

  const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? 'http://localhost:3000'

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Topbar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Builder de Página</h1>
          <p className="text-xs text-gray-500">Página inicial da loja</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle view */}
          <div className="flex rounded-lg border border-gray-200 p-0.5">
            <button
              onClick={() => setViewMode('canvas')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'canvas' ? 'bg-violet-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Estrutura
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'preview' ? 'bg-violet-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Preview
            </button>
          </div>

          {/* Toggle device (só no preview) */}
          {viewMode === 'preview' && (
            <div className="flex rounded-lg border border-gray-200 p-0.5">
              <button
                onClick={() => setDeviceMode('desktop')}
                className={`rounded-md p-1.5 transition-colors ${
                  deviceMode === 'desktop' ? 'bg-violet-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Desktop"
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDeviceMode('mobile')}
                className={`rounded-md p-1.5 transition-colors ${
                  deviceMode === 'mobile' ? 'bg-violet-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Mobile"
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>
          )}

          <a
            href={STOREFRONT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver loja
          </a>

          {isSaving && (
            <span className="flex items-center gap-1 text-xs text-violet-600">
              <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Salvando...
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Painel esquerdo: seções disponíveis */}
        <SectionPanel onAdd={addSection} isSaving={isSaving} />

        {/* Área central */}
        <div className="flex flex-1 flex-col overflow-hidden bg-gray-100">
          {isLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-gray-400">Carregando página...</p>
            </div>
          ) : viewMode === 'canvas' ? (
            /* Modo estrutura: lista drag-and-drop */
            <BuilderCanvas
              sections={sections}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onReorder={reorderSections}
              onDuplicate={duplicateSection}
              onRemove={removeSection}
            />
          ) : (
            /* Modo preview: renderiza as seções visualmente */
            <div className="flex flex-1 items-start justify-center overflow-y-auto p-6">
              <div
                className={`overflow-hidden rounded-2xl bg-white shadow-xl transition-all ${
                  deviceMode === 'mobile' ? 'w-[375px]' : 'w-full max-w-4xl'
                }`}
              >
                {sections.length === 0 ? (
                  <div className="flex h-64 items-center justify-center text-gray-400 text-sm">
                    Nenhuma seção adicionada
                  </div>
                ) : (
                  <div className="space-y-1">
                    {[...sections]
                      .sort((a, b) => a.order - b.order)
                      .map((section) => (
                        <SectionPreview
                          key={section.id}
                          section={section}
                          isSelected={selectedId === section.id}
                          onClick={() => { setSelectedId(section.id); setViewMode('canvas') }}
                        />
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Painel direito: editor de props */}
        {selectedSection && (
          <PropsEditor
            section={selectedSection}
            onUpdate={updateSection}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  )
}
