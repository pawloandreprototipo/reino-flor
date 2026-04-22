import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../lib/prisma'
import { ok, notFound, serverError } from '../../../../lib/response'

const STORE_SLUG = process.env.NEXT_PUBLIC_STORE_SLUG ?? 'reino-flor-store'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const { slug } = req.query

  try {
    const store = await prisma.store.findUnique({ where: { slug: STORE_SLUG } })
    if (!store) return notFound(res)

    const product = await prisma.product.findFirst({
      where: { slug: String(slug), storeId: store.id, status: 'ACTIVE' },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { where: { active: true } },
        category: { select: { id: true, name: true, slug: true } },
        inventory: { select: { quantity: true } },
        reviews: {
          where: { status: 'APPROVED' },
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { reviews: true } },
      },
    })

    if (!product) return notFound(res)
    return ok(res, product)
  } catch (e) {
    return serverError(res, e)
  }
}
