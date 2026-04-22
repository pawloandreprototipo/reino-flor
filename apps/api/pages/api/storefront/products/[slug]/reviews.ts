import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../../lib/prisma'
import { ok, notFound, serverError } from '../../../../../lib/response'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const { slug } = req.query

  try {
    const product = await prisma.product.findFirst({
      where: { slug: String(slug), status: 'ACTIVE' },
    })
    if (!product) return notFound(res)

    const { page = '1', limit = '10' } = req.query
    const pageNum = Math.max(1, Number(page) || 1)
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 10))

    const where = { productId: product.id, status: 'APPROVED' as const }

    const [reviews, total, avgResult] = await Promise.all([
      prisma.review.findMany({
        where,
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.review.count({ where }),
      prisma.review.aggregate({ where, _avg: { rating: true } }),
    ])

    return ok(res, {
      reviews,
      total,
      page: pageNum,
      limit: limitNum,
      avgRating: Math.round((avgResult._avg.rating ?? 0) * 10) / 10,
    })
  } catch (e) {
    return serverError(res, e)
  }
}
