import { formatCurrency, formatDateShort, slugify, ORDER_STATUS_LABELS } from '@/lib/utils'

describe('formatCurrency', () => {
  it('formata valor em BRL', () => {
    expect(formatCurrency(89.9)).toContain('89')
    expect(formatCurrency(89.9)).toContain('R$')
  })

  it('formata zero corretamente', () => {
    expect(formatCurrency(0)).toContain('0')
  })
})

describe('slugify', () => {
  it('converte texto para slug', () => {
    expect(slugify('Buquê de Rosas')).toBe('buque-de-rosas')
  })

  it('remove caracteres especiais', () => {
    expect(slugify('Orquídea & Flores!')).toBe('orquidea-flores')
  })

  it('remove hífens no início e fim', () => {
    expect(slugify('-teste-')).toBe('teste')
  })
})

describe('ORDER_STATUS_LABELS', () => {
  it('contém todos os status', () => {
    const statuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']
    statuses.forEach(s => expect(ORDER_STATUS_LABELS[s]).toBeTruthy())
  })
})
