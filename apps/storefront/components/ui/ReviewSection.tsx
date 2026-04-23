'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useReviews, useSubmitReview } from '@/hooks/useReviews'

interface ReviewSectionProps {
  productSlug: string
  productId: string
  avgRating: number
  totalReviews: number
}

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <span className="inline-flex gap-0.5 text-lg" aria-label={`${rating} de ${max} estrelas`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}>
          {i < Math.round(rating) ? '★' : '☆'}
        </span>
      ))}
    </span>
  )
}

function ClickableStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)

  return (
    <div className="inline-flex gap-1" role="radiogroup" aria-label="Nota">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="text-2xl transition-colors"
          aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
        >
          <span className={(hover || value) >= star ? 'text-yellow-400' : 'text-gray-300'}>
            {(hover || value) >= star ? '★' : '☆'}
          </span>
        </button>
      ))}
    </div>
  )
}

export function ReviewSection({ productSlug, productId, avgRating, totalReviews }: ReviewSectionProps) {
  const { isLoggedIn } = useAuth()
  const { data, isLoading } = useReviews(productSlug)
  const submitReview = useSubmitReview(productSlug)

  const [formRating, setFormRating] = useState(0)
  const [formTitle, setFormTitle] = useState('')
  const [formBody, setFormBody] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const reviews = data?.reviews ?? []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (formRating === 0) {
      setFormError('Selecione uma nota')
      return
    }

    try {
      await submitReview.mutateAsync({
        productId,
        rating: formRating,
        title: formTitle || undefined,
        body: formBody || undefined,
      })
      setFormRating(0)
      setFormTitle('')
      setFormBody('')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setFormError(e.response?.data?.error ?? 'Erro ao enviar avaliação')
    }
  }

  return (
    <div className="mt-16">
      <h2 className="mb-6 text-xl font-bold text-gray-900">Avaliações</h2>

      {/* Summary */}
      <div className="mb-6 flex items-center gap-3">
        <StarRating rating={avgRating} />
        <span className="text-sm text-gray-500">
          {avgRating.toFixed(1)} ({totalReviews} avaliação{totalReviews !== 1 ? 'ões' : ''})
        </span>
      </div>

      {/* Review Form */}
      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-700">Deixe sua avaliação</p>
          <div>
            <ClickableStars value={formRating} onChange={setFormRating} />
          </div>
          <input
            type="text"
            placeholder="Título (opcional)"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
          />
          <textarea
            placeholder="Sua avaliação..."
            value={formBody}
            onChange={(e) => setFormBody(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none resize-none"
          />
          {formError && <p className="text-sm text-red-500">{formError}</p>}
          <button
            type="submit"
            disabled={submitReview.isPending}
            className="rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition-colors disabled:opacity-50"
          >
            {submitReview.isPending ? 'Enviando...' : 'Enviar avaliação'}
          </button>
        </form>
      ) : (
        <div className="mb-8 rounded-2xl border border-gray-200 bg-gray-50 p-5 text-center">
          <p className="text-sm text-gray-500">
            <Link href="/login" className="font-semibold text-violet-600 hover:underline">
              Faça login para avaliar
            </Link>
          </p>
        </div>
      )}

      {/* Review List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-400">Nenhuma avaliação ainda.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-gray-900">{review.user.name}</p>
                <StarRating rating={review.rating} />
              </div>
              {review.title && <p className="font-medium text-gray-800">{review.title}</p>}
              {review.body && <p className="mt-1 text-sm text-gray-600">{review.body}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
