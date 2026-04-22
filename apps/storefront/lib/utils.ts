export const STORE_SLUG = process.env.NEXT_PUBLIC_STORE_SLUG ?? 'reino-flor-store'
export const TENANT_SLUG = process.env.NEXT_PUBLIC_TENANT_SLUG ?? 'reino-flor'

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(date))
}

export function calcDiscount(price: number, comparePrice?: number): number | null {
  if (!comparePrice || comparePrice <= price) return null
  return Math.round(((comparePrice - price) / comparePrice) * 100)
}
