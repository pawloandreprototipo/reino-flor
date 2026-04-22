export type SectionType = 'hero' | 'product_grid' | 'banner' | 'testimonials' | 'newsletter'

export interface Section {
  id: string
  type: SectionType
  order: number
  props: Record<string, unknown>
}

export interface SectionDefinition {
  type: SectionType
  label: string
  icon: string
  description: string
  defaultProps: Record<string, unknown>
  fields: FieldDefinition[]
}

export interface FieldDefinition {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'url' | 'color' | 'toggle'
  placeholder?: string
  hint?: string
}

export const SECTION_DEFINITIONS: SectionDefinition[] = [
  {
    type: 'hero',
    label: 'Hero',
    icon: '🖼',
    description: 'Banner principal com título e botão de ação',
    defaultProps: {
      title: 'Título principal',
      subtitle: 'Subtítulo da seção',
      buttonText: 'Ver produtos',
      buttonUrl: '/produtos',
      backgroundImage: '',
    },
    fields: [
      { key: 'title', label: 'Título', type: 'text', placeholder: 'Ex: Flores que encantam 🌸' },
      { key: 'subtitle', label: 'Subtítulo', type: 'text', placeholder: 'Ex: Entrega em todo o Brasil' },
      { key: 'buttonText', label: 'Texto do botão', type: 'text', placeholder: 'Ver produtos' },
      { key: 'buttonUrl', label: 'URL do botão', type: 'url', placeholder: '/produtos' },
      { key: 'backgroundImage', label: 'Imagem de fundo (URL)', type: 'url', placeholder: 'https://...' },
    ],
  },
  {
    type: 'product_grid',
    label: 'Grade de Produtos',
    icon: '🛍',
    description: 'Exibe produtos em grade com título',
    defaultProps: { title: 'Destaques', limit: 6 },
    fields: [
      { key: 'title', label: 'Título da seção', type: 'text', placeholder: 'Destaques' },
      { key: 'limit', label: 'Quantidade de produtos', type: 'number', hint: 'Máximo de produtos exibidos' },
    ],
  },
  {
    type: 'banner',
    label: 'Banner',
    icon: '📢',
    description: 'Imagem com texto sobreposto',
    defaultProps: {
      title: 'Promoção especial',
      subtitle: 'Aproveite agora',
      imageUrl: '',
      buttonText: 'Ver oferta',
      buttonUrl: '/produtos',
    },
    fields: [
      { key: 'title', label: 'Título', type: 'text' },
      { key: 'subtitle', label: 'Subtítulo', type: 'text' },
      { key: 'imageUrl', label: 'URL da imagem', type: 'url' },
      { key: 'buttonText', label: 'Texto do botão', type: 'text' },
      { key: 'buttonUrl', label: 'URL do botão', type: 'url' },
    ],
  },
  {
    type: 'testimonials',
    label: 'Depoimentos',
    icon: '💬',
    description: 'Depoimentos de clientes',
    defaultProps: {
      title: 'O que nossos clientes dizem',
      items: [
        { name: 'Maria S.', text: 'Flores lindíssimas! Chegaram frescas e bem embaladas.', rating: 5 },
        { name: 'João P.', text: 'Atendimento excelente, recomendo muito!', rating: 5 },
      ],
    },
    fields: [
      { key: 'title', label: 'Título da seção', type: 'text' },
    ],
  },
  {
    type: 'newsletter',
    label: 'Newsletter',
    icon: '📧',
    description: 'Formulário de captura de e-mail',
    defaultProps: {
      title: 'Receba novidades',
      subtitle: 'Cadastre seu e-mail e ganhe 10% de desconto',
    },
    fields: [
      { key: 'title', label: 'Título', type: 'text' },
      { key: 'subtitle', label: 'Subtítulo', type: 'text' },
    ],
  },
]

export function getSectionDefinition(type: SectionType): SectionDefinition {
  return SECTION_DEFINITIONS.find(d => d.type === type)!
}

let _sectionCounter = 0

export function createSection(type: SectionType, order: number): Section {
  const def = getSectionDefinition(type)
  return {
    id: `${type}-${Date.now()}-${++_sectionCounter}`,
    type,
    order,
    props: { ...def.defaultProps },
  }
}
