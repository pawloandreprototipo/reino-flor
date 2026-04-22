import Link from 'next/link'
import { ShoppingCart, Star } from 'lucide-react'
import { formatCurrency, calcDiscount } from '@/lib/utils'
import type { Product } from '@/hooks/useProducts'

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const discount = calcDiscount(Number(product.price), Number(product.comparePrice))
  const imageUrl = product.images[0]?.url ?? `https://via.placeholder.com/400x400?text=${encodeURIComponent(product.name)}`
  const inStock = (product.inventory?.quantity ?? 0) > 0

  return (
    <div className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Imagem */}
      <Link href={`/produtos/${product.slug}`} className="relative block aspect-square overflow-hidden bg-gray-50">
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {discount && (
          <span className="absolute left-3 top-3 rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">
            -{discount}%
          </span>
        )}
        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="rounded-full bg-gray-800 px-3 py-1 text-xs font-medium text-white">Esgotado</span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        {product.category && (
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-violet-600">
            {product.category.name}
          </p>
        )}
        <Link href={`/produtos/${product.slug}`}>
          <h3 className="text-sm font-semibold text-gray-900 hover:text-violet-600 line-clamp-2 transition-colors">
            {product.name}
          </h3>
        </Link>

        {product._count && product._count.reviews > 0 && (
          <div className="mt-1 flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-gray-500">({product._count.reviews})</span>
          </div>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(Number(product.price))}</p>
            {product.comparePrice && (
              <p className="text-xs text-gray-400 line-through">{formatCurrency(Number(product.comparePrice))}</p>
            )}
          </div>
          {inStock && onAddToCart && (
            <button
              onClick={() => onAddToCart(product)}
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700 transition-colors"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Adicionar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
