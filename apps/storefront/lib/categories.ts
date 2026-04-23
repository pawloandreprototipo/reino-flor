import type { CategoryNode } from '@/hooks/useCategories'

export interface Breadcrumb {
  label: string
  href: string
}

/**
 * Find a category node by slug in a tree structure.
 * Returns the node and its ancestor path for breadcrumb generation.
 */
export function findCategoryInTree(
  tree: CategoryNode[],
  targetSlug: string,
  ancestors: CategoryNode[] = []
): { node: CategoryNode; path: CategoryNode[] } | null {
  for (const node of tree) {
    if (node.slug === targetSlug) {
      return { node, path: [...ancestors, node] }
    }
    if (node.children.length > 0) {
      const found = findCategoryInTree(node.children, targetSlug, [...ancestors, node])
      if (found) return found
    }
  }
  return null
}

/**
 * Build breadcrumb trail for a category page.
 * Always starts with Home > Categorias, then ancestor chain, then current category.
 */
export function buildBreadcrumbs(
  categorySlug: string,
  categories: CategoryNode[]
): Breadcrumb[] {
  const crumbs: Breadcrumb[] = [
    { label: 'Home', href: '/' },
    { label: 'Categorias', href: '/categorias' },
  ]

  const result = findCategoryInTree(categories, categorySlug)
  if (!result) return crumbs

  for (const node of result.path) {
    crumbs.push({ label: node.name, href: `/categorias/${node.slug}` })
  }

  return crumbs
}
