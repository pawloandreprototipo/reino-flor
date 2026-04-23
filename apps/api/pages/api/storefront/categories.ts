import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { ok, notFound, serverError } from '../../../lib/response'

interface CategoryNode {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  sortOrder: number
  _count: { products: number }
  children: CategoryNode[]
}

function buildTree(categories: any[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>()
  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [] })
  }

  const roots: CategoryNode[] = []
  for (const cat of categories) {
    const node = map.get(cat.id)!
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const sortChildren = (nodes: CategoryNode[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder)
    nodes.forEach(n => sortChildren(n.children))
  }
  sortChildren(roots)
  return roots
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  try {
    const { storeSlug } = req.query
    const slug = String(storeSlug || process.env.NEXT_PUBLIC_STORE_SLUG || 'reino-flor-store')

    const store = await prisma.store.findUnique({ where: { slug } })
    if (!store) return notFound(res)

    const categories = await prisma.category.findMany({
      where: { storeId: store.id, active: true },
      select: {
        id: true, name: true, slug: true, description: true,
        imageUrl: true, sortOrder: true, parentId: true,
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: 'asc' },
    })

    return ok(res, buildTree(categories))
  } catch (e) {
    return serverError(res, e)
  }
}
