'use client'

import { Section } from './sectionDefinitions'

interface SectionPreviewProps {
  section: Section
  isSelected: boolean
  onClick: () => void
}

export function SectionPreview({ section, isSelected, onClick }: SectionPreviewProps) {
  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer overflow-hidden rounded-xl border-2 transition-all ${
        isSelected ? 'border-violet-500' : 'border-transparent hover:border-violet-300'
      }`}
    >
      {isSelected && (
        <div className="absolute right-2 top-2 z-10 rounded-full bg-violet-600 px-2 py-0.5 text-xs font-bold text-white">
          Editando
        </div>
      )}
      <PreviewContent section={section} />
    </div>
  )
}

function PreviewContent({ section }: { section: Section }) {
  const { props } = section

  switch (section.type) {
    case 'hero':
      return (
        <div
          className="flex min-h-[120px] items-center justify-center bg-gradient-to-br from-violet-600 to-pink-500 p-6 text-center"
          style={props.backgroundImage ? { backgroundImage: `url(${props.backgroundImage})`, backgroundSize: 'cover' } : {}}
        >
          {props.backgroundImage && <div className="absolute inset-0 bg-black/40 rounded-xl" />}
          <div className="relative z-10">
            <h2 className="text-lg font-bold text-white">{props.title || 'Título'}</h2>
            <p className="mt-1 text-sm text-white/80">{props.subtitle || 'Subtítulo'}</p>
            <div className="mt-3 inline-block rounded-xl bg-white px-4 py-1.5 text-xs font-bold text-violet-700">
              {props.buttonText || 'Botão'}
            </div>
          </div>
        </div>
      )

    case 'product_grid':
      return (
        <div className="bg-white p-4">
          <p className="mb-3 text-sm font-bold text-gray-900">{props.title || 'Produtos'}</p>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: Math.min(props.limit ?? 6, 6) }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        </div>
      )

    case 'banner':
      return (
        <div
          className="relative flex min-h-[80px] items-center justify-center overflow-hidden rounded-xl bg-gray-800 p-4 text-center"
          style={props.imageUrl ? { backgroundImage: `url(${props.imageUrl})`, backgroundSize: 'cover' } : {}}
        >
          <div className="absolute inset-0 bg-black/50 rounded-xl" />
          <div className="relative z-10">
            <p className="text-sm font-bold text-white">{props.title || 'Banner'}</p>
            <p className="text-xs text-white/70">{props.subtitle}</p>
          </div>
        </div>
      )

    case 'testimonials':
      return (
        <div className="bg-gray-50 p-4">
          <p className="mb-3 text-sm font-bold text-gray-900">{props.title || 'Depoimentos'}</p>
          <div className="grid grid-cols-2 gap-2">
            {(props.items ?? []).slice(0, 2).map((item: any, i: number) => (
              <div key={i} className="rounded-lg bg-white p-2 shadow-sm">
                <p className="text-xs text-gray-600 line-clamp-2">"{item.text}"</p>
                <p className="mt-1 text-xs font-semibold text-gray-800">— {item.name}</p>
              </div>
            ))}
          </div>
        </div>
      )

    case 'newsletter':
      return (
        <div className="bg-violet-600 p-4 text-center">
          <p className="text-sm font-bold text-white">{props.title || 'Newsletter'}</p>
          <p className="mt-1 text-xs text-violet-200">{props.subtitle}</p>
          <div className="mt-3 flex gap-2">
            <div className="flex-1 rounded-lg bg-white/20 px-3 py-1.5 text-xs text-white/60">seu@email.com</div>
            <div className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-violet-700">Assinar</div>
          </div>
        </div>
      )

    default:
      return <div className="bg-gray-100 p-4 text-center text-xs text-gray-400">Seção desconhecida</div>
  }
}
