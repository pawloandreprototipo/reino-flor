import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@reino-flor/database'
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth'
import { ok, serverError, badRequest } from '../../../lib/response'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req as AuthenticatedRequest

  const store = await prisma.store.findFirst({ where: { tenantId: user.tenantId } })
  if (!store) return badRequest(res, 'Loja não encontrada')

  try {
    if (req.method === 'GET') {
      const { page = '1', limit = '20', status, search } = req.query

      const where: any = { storeId: store.id }
      if (status) where.status = status
      if (search) {
        where.OR = [
          { id: { contains: String(search) } },
          { user: { name: { contains: String(search), mode: 'insensitive' } } },
          { user: { email: { contains: String(search), mode: 'insensitive' } } },
        ]
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            user: { select: { id: true, name: true, email: true } },
            items: { include: { product: { select: { name: true } } } },
            payment: { select: { status: true, method: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
        }),
        prisma.order.count({ where }),
      ])

      return ok(res, { orders, total, page: Number(page), limit: Number(limit) })
    }

    return res.status(405).json({ success: false, error: 'Método não permitido' })
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler, 'orders:read')
