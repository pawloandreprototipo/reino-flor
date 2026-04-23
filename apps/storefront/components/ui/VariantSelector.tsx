'use client'

import { useState, useEffect } from 'react'
import { computeVariantState, type Variant } from '@/lib/variants'

interface VariantSelectorProps {
  variants: Variant[]
  selectedVariantId: string | undefined
  onSelect: (variantId: string) => void
}

export function VariantSelector({ variants, selectedVariantId, onSelect }: VariantSelectorProps) {
  const [selections, setSelections] = useState<Record<string, string>>({})

  const { optionGroups, matchedVariant, allOptionsSelected } = computeVariantState(variants, selections)

  // Sync parent when a full match is found
  useEffect(() => {
    if (allOptionsSelected && matchedVariant && matchedVariant.id !== selectedVariantId) {
      onSelect(matchedVariant.id)
    }
  }, [allOptionsSelected, matchedVariant, selectedVariantId, onSelect])

  const handleSelect = (optionType: string, value: string) => {
    setSelections((prev) => ({ ...prev, [optionType]: value }))
  }

  if (variants.length === 0) return null

  return (
    <div className="space-y-4">
      {Array.from(optionGroups.entries()).map(([optionType, values]) => (
        <div key={optionType}>
          <p className="mb-2 text-sm font-semibold capitalize text-gray-700">{optionType}</p>
          <div className="flex flex-wrap gap-2">
            {values.map(({ value, available, inStock }) => {
              const isSelected = selections[optionType] === value
              const isOutOfStock = available && !inStock

              let className =
                'rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors '

              if (isSelected) {
                className += 'border-violet-600 bg-violet-600 text-white'
              } else if (!available) {
                className += 'border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed'
              } else if (isOutOfStock) {
                className += 'border-gray-300 text-gray-400 line-through cursor-not-allowed'
              } else {
                className += 'border-gray-300 bg-white text-gray-700 hover:border-violet-400 cursor-pointer'
              }

              return (
                <button
                  key={value}
                  disabled={!available}
                  onClick={() => available && handleSelect(optionType, value)}
                  className={className}
                >
                  {value}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
