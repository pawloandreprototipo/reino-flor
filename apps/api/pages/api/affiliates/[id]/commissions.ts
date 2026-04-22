import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@reino-flor/database'
import { withAuth, AuthenticatedRequest } from '../../../../middleware/auth'
import { ok, notFound, serverError } from '../../../../lib/response'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Método não permitido' })

  const { user } = req as AuthenticatedRequest
  const { id } = req.query

  try {
    const affiliate = await prisma.affiliate.findFirst({
      where: { id: String(id), user: { tenantId: user.tenantId } },
    })
    if (!affiliate) return notFound(res)

    const { page = '1', limit = '20', status } = req.query
    const pageNum = Math.max(1, Number(page) || 1)
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20))

    const where: any = { affiliateId: affiliate.id }
    if (status) where.status = String(status)

    const [commissions, total] = await Promise.all([
      prisma.affiliateCommission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.affiliateCommission.count({ where }),
    ])

    return ok(res, { commissions, total, page: pageNum, limit: limitNum })
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler, 'affiliates:manage')
