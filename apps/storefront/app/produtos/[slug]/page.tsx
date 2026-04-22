'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { ShoppingCart, Star, Package, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useProduct } from '@/hooks/useProducts'
import { useCart } from '@/context/CartContext'
import { formatCurrency, calcDiscount } from '@/lib/utils'

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: product, isLoading } = useProduct(slug)
  const { addItem } = useCart()
  const [qty, setQty] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>()
  const [added, setAdded] = useState(false)

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-2xl bg-gray-200" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-6 animate-pulse rounded bg-gray-200" />)}
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-400">Produto não encontrado</p>
        <Link href="/produtos" className="mt-4 inline-block text-violet-600 hover:underline">← Voltar</Link>
      </div>
    )
  }

  const discount = calcDiscount(Number(product.price), Number(product.comparePrice))
  const imageUrl = product.images[0]?.url ?? `https://via.placeholder.com/600x600?text=${encodeURIComponent(product.name)}`
  const inStock = (product.inventory?.quantity ?? 0) > 0
  const avgRating = product.reviews.length > 0
    ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
    : 0

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      variantId: selectedVariant,
      name: product.name,
      price: Number(product.price),
      quantity: qty,
      slug: product.slug,
      imageUrl: product.images[0]?.url,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/produtos" className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-violet-600">
        <ArrowLeft className="h-4 w-4" /> Voltar aos produtos
      </Link>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        {/* Galeria */}
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-2xl bg-gray-100">
            <img src={imageUrl} alt={product.name} className="h-full w-full object-cover" />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img, i) => (
                <img key={i} src={img.url} alt={img.alt ?? product.name}
                  className="h-16 w-16 flex-shrink-0 rounded-xl object-cover border-2 border-transparent hover:border-violet-500 cursor-pointer" />
              ))}
            </div>
          )}
        </div>

        {/* Detalhes */}
        <div className="flex flex-col gap-4">
          {product.category && (
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">{product.category.name}</p>
          )}
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

          {avgRating > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className="text-sm text-gray-500">({product._count?.reviews} avaliações)</span>
            </div>
          )}

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-gray-900">{formatCurrency(Number(product.price))}</span>
            {product.comparePrice && (
              <span className="text-lg text-gray-400 line-through">{formatCurrency(Number(product.comparePrice))}</span>
            )}
            {discount && (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-sm font-bold text-rose-600">-{discount}%</span>
            )}
          </div>

          {product.description && (
            <p className="text-sm leading-relaxed text-gray-600">{product.description}</p>
          )}

          {/* Variantes */}
          {product.variants.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">Variante</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v.id)}
                    className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors ${
                      selectedVariant === v.id
                        ? 'border-violet-600 bg-violet-50 text-violet-700'
                        : 'border-gray-300 text-gray-700 hover:border-violet-400'
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantidade */}
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-gray-700">Quantidade</p>
            <div className="flex items-center rounded-xl border border-gray-300">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-2 text-gray-600 hover:bg-gray-50">−</button>
              <span className="w-10 text-center text-sm font-medium">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="px-3 py-2 text-gray-600 hover:bg-gray-50">+</button>
            </div>
          </div>

          {/* Estoque */}
          <div className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-gray-400" />
            {inStock
              ? <span className="text-green-600 font-medium">Em estoque ({product.inventory?.quantity} unidades)</span>
              : <span className="text-red-500 font-medium">Esgotado</span>
            }
          </div>

          {/* Botão */}
          <button
            onClick={handleAddToCart}
            disabled={!inStock}
            className={`flex items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold transition-all ${
              added
                ? 'bg-green-500 text-white'
                : inStock
                ? 'bg-violet-600 text-white hover:bg-violet-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="h-5 w-5" />
            {added ? '✓ Adicionado ao carrinho!' : 'Adicionar ao carrinho'}
          </button>
        </div>
      </div>

      {/* Reviews */}
      {product.reviews.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-6 text-xl font-bold text-gray-900">Avaliações</h2>
          <div className="space-y-4">
            {product.reviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-900">{review.user.name}</p>
                  <div className="flex">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`h-4 w-4 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                    ))}
                  </div>
                </div>
                {review.title && <p className="font-medium text-gray-800">{review.title}</p>}
                {review.body && <p className="mt-1 text-sm text-gray-600">{review.body}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
