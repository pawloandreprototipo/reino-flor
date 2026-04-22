import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { ok, serverError } from '../../../lib/response'

const STORE_SLUG = process.env.NEXT_PUBLIC_STORE_SLUG ?? 'reino-flor-store'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  try {
    const { page = '1', limit = '12', search, categoryId, featured } = req.query

    const store = await prisma.store.findUnique({ where: { slug: STORE_SLUG } })
    if (!store) return res.status(404).json({ success: false, error: 'Loja não encontrada' })

    const where: any = { storeId: store.id, status: 'ACTIVE' }
    if (search) where.name = { contains: String(search), mode: 'insensitive' }
    if (categoryId) where.categoryId = String(categoryId)
    if (featured === 'true') where.featured = true

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          category: { select: { id: true, name: true, slug: true } },
          inventory: { select: { quantity: true } },
          _count: { select: { reviews: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.product.count({ where }),
    ])

    return ok(res, { products, total, page: Number(page), limit: Number(limit) })
  } catch (e) {
    return serverError(res, e)
  }
}
