export interface Variant {
  id: string
  name: string
  price: number
  stock: number
  options: Record<string, string>
  imageUrl?: string
}

/**
 * Extract all unique option types and their values from variants.
 * Preserves first-seen order.
 */
export function extractVariantOptions(variants: Variant[]): Map<string, string[]> {
  const result = new Map<string, string[]>()
  for (const variant of variants) {
    for (const [key, value] of Object.entries(variant.options)) {
      const existing = result.get(key)
      if (!existing) {
        result.set(key, [value])
      } else if (!existing.includes(value)) {
        existing.push(value)
      }
    }
  }
  return result
}

/**
 * Find the variant that matches all selected options exactly.
 */
export function findMatchingVariant(
  variants: Variant[],
  selectedOptions: Record<string, string>
): Variant | undefined {
  const entries = Object.entries(selectedOptions)
  return variants.find((v) =>
    entries.every(([key, value]) => v.options[key] === value)
  )
}

/**
 * Get available values for a target option type given current selections.
 * Only includes values from in-stock variants (stock > 0).
 */
export function getAvailableOptionsForSelection(
  variants: Variant[],
  selectedOptions: Record<string, string>,
  targetOptionType: string
): string[] {
  const otherSelections = { ...selectedOptions }
  delete otherSelections[targetOptionType]
  const otherEntries = Object.entries(otherSelections)

  const values = new Set<string>()
  for (const v of variants) {
    if (v.stock <= 0) continue
    if (v.options[targetOptionType] === undefined) continue
    const matchesOthers = otherEntries.every(([k, val]) => v.options[k] === val)
    if (matchesOthers) {
      values.add(v.options[targetOptionType])
    }
  }
  return Array.from(values)
}

/**
 * Compute full variant state for the UI: option groups with availability,
 * matched variant, and whether all options are selected.
 */
export function computeVariantState(
  variants: Variant[],
  currentSelections: Record<string, string>
): {
  optionGroups: Map<string, { value: string; available: boolean; inStock: boolean }[]>
  matchedVariant: Variant | undefined
  allOptionsSelected: boolean
} {
  const optionTypes = extractVariantOptions(variants)

  const optionGroups = new Map<string, { value: string; available: boolean; inStock: boolean }[]>()

  for (const [optionType, values] of Array.from(optionTypes)) {
    const enriched = values.map((value) => {
      const otherSelections = { ...currentSelections }
      delete otherSelections[optionType]
      const otherEntries = Object.entries(otherSelections)

      const compatible = variants.filter((v) => {
        if (v.options[optionType] !== value) return false
        return otherEntries.every(([k, sel]) => v.options[k] === sel)
      })

      return {
        value,
        available: compatible.length > 0,
        inStock: compatible.some((v) => v.stock > 0),
      }
    })

    optionGroups.set(optionType, enriched)
  }

  const allOptionsSelected =
    optionTypes.size > 0 &&
    Array.from(optionTypes.keys()).every((type) => currentSelections[type] !== undefined)

  const matchedVariant = allOptionsSelected
    ? findMatchingVariant(variants, currentSelections)
    : undefined

  return { optionGroups, matchedVariant, allOptionsSelected }
}
