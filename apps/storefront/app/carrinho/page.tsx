'use client'

import Link from 'next/link'
import { Trash2, ShoppingBag } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { formatCurrency } from '@/lib/utils'

export default function CarrinhoPage() {
  const { items, removeItem, updateQty, subtotal, itemCount } = useCart()

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-gray-300" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Carrinho vazio</h1>
        <p className="mt-2 text-gray-500">Adicione produtos para continuar</p>
        <Link href="/produtos" className="mt-6 inline-block rounded-2xl bg-violet-600 px-8 py-3 text-sm font-bold text-white hover:bg-violet-700">
          Ver produtos
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">
        Carrinho <span className="text-gray-400 text-xl font-normal">({itemCount} {itemCount === 1 ? 'item' : 'itens'})</span>
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Itens */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.productId + (item.variantId ?? '')} className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-4">
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                {item.imageUrl
                  ? <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  : <div className="h-full w-full bg-violet-100" />
                }
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex items-start justify-between">
                  <Link href={`/produtos/${item.slug}`} className="text-sm font-semibold text-gray-900 hover:text-violet-600">
                    {item.name}
                  </Link>
                  <button
                    onClick={() => removeItem(item.productId, item.variantId)}
                    className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-xl border border-gray-200">
                    <button onClick={() => updateQty(item.productId, item.quantity - 1, item.variantId)} className="px-2.5 py-1 text-gray-600 hover:bg-gray-50">−</button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button onClick={() => updateQty(item.productId, item.quantity + 1, item.variantId)} className="px-2.5 py-1 text-gray-600 hover:bg-gray-50">+</button>
                  </div>
                  <p className="font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Resumo */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 h-fit space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Resumo</h2>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Frete</span>
            <span className="text-green-600">Calculado no checkout</span>
          </div>
          <div className="border-t border-gray-100 pt-4 flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <Link
            href="/checkout"
            className="block w-full rounded-2xl bg-violet-600 py-3 text-center text-sm font-bold text-white hover:bg-violet-700 transition-colors"
          >
            Finalizar compra
          </Link>
          <Link href="/produtos" className="block text-center text-sm text-gray-500 hover:text-violet-600">
            ← Continuar comprando
          </Link>
        </div>
      </div>
    </div>
  )
}
