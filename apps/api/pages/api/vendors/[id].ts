import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@reino-flor/database'
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth'
import { ok, badRequest, notFound, serverError } from '../../../lib/response'

const updateSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'SUSPENDED']).optional(),
  commissionRate: z.number().min(0).max(100).optional(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req as AuthenticatedRequest
  const { id } = req.query

  try {
    const vendor = await prisma.vendor.findFirst({
      where: { id: String(id), user: { tenantId: user.tenantId } },
      include: {
        user: { select: { id: true, name: true, email: true } },
        products: { select: { id: true, name: true, slug: true, price: true, status: true }, take: 20, orderBy: { createdAt: 'desc' } },
        payouts: { orderBy: { createdAt: 'desc' }, take: 20 },
        _count: { select: { products: true, payouts: true } },
      },
    })
    if (!vendor) return notFound(res)

    if (req.method === 'GET') {
      return ok(res, vendor)
    }

    if (req.method === 'PUT') {
      const parsed = updateSchema.safeParse(req.body)
      if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

      const updated = await prisma.vendor.update({
        where: { id: vendor.id },
        data: parsed.data,
        include: { user: { select: { id: true, name: true, email: true } } },
      })
      return ok(res, updated)
    }

    return res.status(405).json({ success: false, error: 'Método não permitido' })
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler, 'vendors:manage')
