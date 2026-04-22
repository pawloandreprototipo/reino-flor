import React from 'react'
import { HeroSection } from '@/components/sections/HeroSection'
import { ProductGridSection } from '@/components/sections/ProductGridSection'
import { NewsletterSection } from '@/components/sections/NewsletterSection'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const STORE_SLUG = process.env.NEXT_PUBLIC_STORE_SLUG ?? 'reino-flor-store'

interface Section {
  id: string
  type: string
  order: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>
}

async function getHomeSections(): Promise<Section[]> {
  try {
    const res = await fetch(`${API_URL}/api/storefront/page/home?storeSlug=${STORE_SLUG}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return getDefaultSections()
    const data = await res.json()
    return data.data?.sections ?? getDefaultSections()
  } catch {
    return getDefaultSections()
  }
}

function getDefaultSections(): Section[] {
  return [
    {
      id: 'hero-1',
      type: 'hero',
      order: 0,
      props: {
        title: 'Flores que encantam 🌸',
        subtitle: 'Entrega em todo o Brasil com frescor garantido',
        buttonText: 'Ver produtos',
        buttonUrl: '/produtos',
      },
    },
    {
      id: 'products-1',
      type: 'product_grid',
      order: 1,
      props: { title: 'Destaques', limit: 8 },
    },
    {
      id: 'newsletter-1',
      type: 'newsletter',
      order: 2,
      props: {
        title: 'Receba novidades',
        subtitle: 'Cadastre seu e-mail e ganhe 10% de desconto na primeira compra',
      },
    },
  ]
}

function renderSection(section: Section) {
  switch (section.type) {
    case 'hero':
      return <HeroSection key={section.id} {...(section.props as unknown as React.ComponentProps<typeof HeroSection>)} />
    case 'product_grid':
      return <ProductGridSection key={section.id} {...(section.props as unknown as React.ComponentProps<typeof ProductGridSection>)} />
    case 'newsletter':
      return <NewsletterSection key={section.id} {...(section.props as unknown as React.ComponentProps<typeof NewsletterSection>)} />
    default:
      return null
  }
}

export default async function HomePage() {
  const sections = await getHomeSections()
  const sorted = [...sections].sort((a, b) => a.order - b.order)

  return (
    <div>
      {sorted.map(renderSection)}
    </div>
  )
}
