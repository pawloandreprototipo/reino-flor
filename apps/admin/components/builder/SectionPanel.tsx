'use client'

import { SECTION_DEFINITIONS, SectionType } from './sectionDefinitions'

interface SectionPanelProps {
  onAdd: (type: SectionType) => void
  isSaving: boolean
}

export function SectionPanel({ onAdd, isSaving }: SectionPanelProps) {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-4">
        <h2 className="text-sm font-semibold text-gray-900">Seções disponíveis</h2>
        <p className="mt-0.5 text-xs text-gray-500">Clique para adicionar à página</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {SECTION_DEFINITIONS.map((def) => (
          <button
            key={def.type}
            onClick={() => onAdd(def.type)}
            disabled={isSaving}
            className="w-full rounded-xl border border-gray-200 bg-white p-3 text-left transition-all hover:border-violet-400 hover:bg-violet-50 disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{def.icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{def.label}</p>
                <p className="text-xs text-gray-500 line-clamp-1">{def.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {isSaving && (
        <div className="border-t border-gray-200 px-4 py-3">
          <p className="text-xs text-violet-600 flex items-center gap-1">
            <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Salvando...
          </p>
        </div>
      )}
    </aside>
  )
}
