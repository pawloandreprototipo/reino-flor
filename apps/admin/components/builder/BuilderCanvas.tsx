'use client'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { LayoutTemplate } from 'lucide-react'
import { Section } from './sectionDefinitions'
import { SortableSectionItem } from './SortableSectionItem'

interface BuilderCanvasProps {
  sections: Section[]
  selectedId: string | null
  onSelect: (id: string) => void
  onReorder: (sections: Section[]) => void
  onDuplicate: (id: string) => void
  onRemove: (id: string) => void
}

export function BuilderCanvas({
  sections,
  selectedId,
  onSelect,
  onReorder,
  onDuplicate,
  onRemove,
}: BuilderCanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sections.findIndex(s => s.id === active.id)
    const newIndex = sections.findIndex(s => s.id === over.id)
    onReorder(arrayMove(sections, oldIndex, newIndex))
  }

  if (sections.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
          <LayoutTemplate className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-500">Nenhuma seção adicionada</p>
        <p className="text-xs text-gray-400">Clique em uma seção no painel esquerdo para começar</p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sections.map(s => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
          {sections.map((section) => (
            <SortableSectionItem
              key={section.id}
              section={section}
              isSelected={selectedId === section.id}
              onSelect={onSelect}
              onDuplicate={onDuplicate}
              onRemove={onRemove}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
