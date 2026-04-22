'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'
import { Section, getSectionDefinition } from './sectionDefinitions'
import { Button } from '@/components/ui/Button'

interface PropsEditorProps {
  section: Section
  onUpdate: (id: string, props: Record<string, any>) => void
  onClose: () => void
}

export function PropsEditor({ section, onUpdate, onClose }: PropsEditorProps) {
  const def = getSectionDefinition(section.type)
  const { register, handleSubmit, reset } = useForm({ defaultValues: section.props })

  useEffect(() => {
    reset(section.props)
  }, [section.id, reset])

  const onSubmit = (data: Record<string, any>) => {
    onUpdate(section.id, data)
  }

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500'

  return (
    <aside className="flex h-full w-72 flex-col border-l border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">{def.icon}</span>
          <h2 className="text-sm font-semibold text-gray-900">{def.label}</h2>
        </div>
        <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Campos */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex-1 space-y-4 p-4">
          {def.fields.map((field) => (
            <div key={field.key} className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-700">{field.label}</label>

              {field.type === 'textarea' ? (
                <textarea
                  rows={3}
                  className={inputClass}
                  placeholder={field.placeholder}
                  {...register(field.key)}
                />
              ) : field.type === 'toggle' ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded" {...register(field.key)} />
                  <span className="text-sm text-gray-600">{field.placeholder ?? 'Ativar'}</span>
                </label>
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : field.type === 'color' ? 'color' : 'text'}
                  className={inputClass}
                  placeholder={field.placeholder}
                  {...register(field.key, { valueAsNumber: field.type === 'number' })}
                />
              )}

              {field.hint && <p className="text-xs text-gray-400">{field.hint}</p>}
            </div>
          ))}

          {/* Seção testimonials: editar itens */}
          {section.type === 'testimonials' && (
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs font-semibold text-gray-600 mb-2">Depoimentos</p>
              <p className="text-xs text-gray-400">
                Os depoimentos são editados diretamente no banco de dados via reviews de produtos.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-4">
          <Button type="submit" className="w-full" size="sm">
            Aplicar alterações
          </Button>
        </div>
      </form>
    </aside>
  )
}
