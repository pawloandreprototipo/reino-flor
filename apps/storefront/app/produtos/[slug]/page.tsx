'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { ShoppingCart, Package, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useProduct } from '@/hooks/useProducts'
import { useCart } from '@/context/CartContext'
import { formatCurrency, calcDiscount } from '@/lib/utils'
import { VariantSelector } from '@/components/ui/VariantSelector'
import { ReviewSection } from '@/components/ui/ReviewSection'
import { RelatedProducts } from '@/components/ui/RelatedProducts'

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: product, isLoading } = useProduct(slug)
  const { addItem } = useCart()
  const [qty, setQty] = useState(1)
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>()
  const [added, setAdded] = useState(false)
  const [activeImage, setActiveImage] = useState(0)

  const handleVariantSelect = useCallback((variantId: string) => {
    setSelectedVariantId(variantId)
  }, [])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-2xl bg-gray-200" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-6 animate-pulse rounded bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-400">Produto não encontrado</p>
        <Link href="/produtos" className="mt-4 inline-block text-violet-600 hover:underline">
          ← Voltar
        </Link>
      </div>
    )
  }

  const matchedVariant = product.variants.find((v) => v.id === selectedVariantId)
  const displayPrice = matchedVariant ? Number(matchedVariant.price) : Number(product.price)
  const discount = calcDiscount(displayPrice, Number(product.comparePrice))
  const images = product.images.length > 0
    ? product.images
    : [{ url: `https://via.placeholder.com/600x600?text=${encodeURIComponent(product.name)}`, alt: product.name }]
  const activeImageUrl = images[activeImage]?.url ?? images[0]?.url

  const inStock = matchedVariant
    ? matchedVariant.stock > 0
    : (product.inventory?.quantity ?? 0) > 0

  const stockDisplay = matchedVariant
    ? matchedVariant.stock
    : product.inventory?.quantity ?? 0

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
      : 0

  const needsVariantSelection = product.variants.length > 0 && !selectedVariantId

  const handleAddToCart = () => {
    if (needsVariantSelection) return
    addItem({
      productId: product.id,
      variantId: matchedVariant?.id,
      name: product.name,
      price: displayPrice,
      quantity: qty,
      slug: product.slug,
      imageUrl: images[0]?.url,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link
        href="/produtos"
        className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-violet-600"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar aos produtos
      </Link>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        {/* Image Gallery */}
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-2xl bg-gray-100">
            <img
              src={activeImageUrl}
              alt={images[activeImage]?.alt ?? product.name}
              className="h-full w-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
                    activeImage === i ? 'border-violet-500' : 'border-transparent hover:border-violet-300'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.alt ?? product.name}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex flex-col gap-4">
          {product.category && (
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
              {product.category.name}
            </p>
          )}
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

          {avgRating > 0 && (
            <div className="flex items-center gap-2">
              <span className="inline-flex gap-0.5 text-lg">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className={s <= Math.round(avgRating) ? 'text-yellow-400' : 'text-gray-300'}>
                    {s <= Math.round(avgRating) ? '★' : '☆'}
                  </span>
                ))}
              </span>
              <span className="text-sm text-gray-500">({product._count?.reviews} avaliações)</span>
            </div>
          )}

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-gray-900">{formatCurrency(displayPrice)}</span>
            {product.comparePrice && (
              <span className="text-lg text-gray-400 line-through">
                {formatCurrency(Number(product.comparePrice))}
              </span>
            )}
            {discount && (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-sm font-bold text-rose-600">
                -{discount}%
              </span>
            )}
          </div>

          {product.description && (
            <p className="text-sm leading-relaxed text-gray-600">{product.description}</p>
          )}

          {/* Variant Selector */}
          {product.variants.length > 0 && (
            <VariantSelector
              variants={product.variants.map((v) => ({
                id: v.id,
                name: v.name,
                price: Number(v.price),
                stock: v.stock,
                options: v.options,
              }))}
              selectedVariantId={selectedVariantId}
              onSelect={handleVariantSelect}
            />
          )}

          {/* Quantity */}
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-gray-700">Quantidade</p>
            <div className="flex items-center rounded-xl border border-gray-300">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3 py-2 text-gray-600 hover:bg-gray-50"
              >
                −
              </button>
              <span className="w-10 text-center text-sm font-medium">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="px-3 py-2 text-gray-600 hover:bg-gray-50"
              >
                +
              </button>
            </div>
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-gray-400" />
            {inStock ? (
              <span className="font-medium text-green-600">Em estoque ({stockDisplay} unidades)</span>
            ) : (
              <span className="font-medium text-red-500">Esgotado</span>
            )}
          </div>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={!inStock || needsVariantSelection}
            className={`flex items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold transition-all ${
              added
                ? 'bg-green-500 text-white'
                : inStock && !needsVariantSelection
                  ? 'bg-violet-600 text-white hover:bg-violet-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="h-5 w-5" />
            {added
              ? '✓ Adicionado ao carrinho!'
              : needsVariantSelection
                ? 'Selecione as opções'
                : 'Adicionar ao carrinho'}
          </button>
        </div>
      </div>

      {/* Reviews Section */}
      <ReviewSection
        productSlug={product.slug}
        productId={product.id}
        avgRating={avgRating}
        totalReviews={product._count?.reviews ?? product.reviews.length}
      />

      {/* Related Products */}
      {product.category && (
        <RelatedProducts categoryId={product.category.id} currentProductId={product.id} />
      )}
    </div>
  )
}
