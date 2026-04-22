import { formatCurrency, calcDiscount } from '@/lib/utils'

describe('formatCurrency', () => {
  it('formata valor em BRL', () => {
    const result = formatCurrency(89.9)
    expect(result).toContain('R$')
    expect(result).toContain('89')
  })

  it('formata zero', () => {
    expect(formatCurrency(0)).toContain('0')
  })

  it('formata valores grandes', () => {
    const result = formatCurrency(1500.5)
    expect(result).toContain('1')
    expect(result).toContain('500')
  })
})

describe('calcDiscount', () => {
  it('calcula percentual de desconto corretamente', () => {
    expect(calcDiscount(90, 100)).toBe(10)
  })

  it('retorna null quando não há preço comparativo', () => {
    expect(calcDiscount(90)).toBeNull()
  })

  it('retorna null quando comparePrice é menor ou igual ao price', () => {
    expect(calcDiscount(100, 90)).toBeNull()
    expect(calcDiscount(100, 100)).toBeNull()
  })

  it('arredonda o percentual', () => {
    expect(calcDiscount(89.9, 120)).toBe(25)
  })
})
