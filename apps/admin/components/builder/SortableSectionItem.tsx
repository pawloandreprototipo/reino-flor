'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Copy, Trash2 } from 'lucide-react'
import { Section, getSectionDefinition } from './sectionDefinitions'

interface SortableSectionItemProps {
  section: Section
  isSelected: boolean
  onSelect: (id: string) => void
  onDuplicate: (id: string) => void
  onRemove: (id: string) => void
}

export function SortableSectionItem({
  section,
  isSelected,
  onSelect,
  onDuplicate,
  onRemove,
}: SortableSectionItemProps) {
  const def = getSectionDefinition(section.type)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 rounded-xl border-2 bg-white p-3 transition-all ${
        isSelected ? 'border-violet-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
      } ${isDragging ? 'shadow-xl' : ''}`}
    >
      {/* Handle de drag */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none rounded p-1 text-gray-300 hover:bg-gray-100 hover:text-gray-500 active:cursor-grabbing"
        aria-label="Arrastar seção"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Info da seção */}
      <button
        onClick={() => onSelect(section.id)}
        className="flex flex-1 items-center gap-2 text-left"
      >
        <span className="text-lg">{def.icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{def.label}</p>
          <p className="truncate text-xs text-gray-400">
            {section.props.title ?? section.props.name ?? def.description}
          </p>
        </div>
      </button>

      {/* Ações */}
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => onSelect(section.id)}
          className="rounded p-1 text-gray-400 hover:bg-violet-50 hover:text-violet-600"
          title="Editar"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDuplicate(section.id)}
          className="rounded p-1 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
          title="Duplicar"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onRemove(section.id)}
          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
          title="Remover"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
