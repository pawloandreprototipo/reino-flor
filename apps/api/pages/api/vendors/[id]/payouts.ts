import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@reino-flor/database'
import { withAuth, AuthenticatedRequest } from '../../../../middleware/auth'
import { ok, created, badRequest, notFound, serverError } from '../../../../lib/response'

const createSchema = z.object({
  amount: z.number().positive(),
  notes: z.string().optional(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req as AuthenticatedRequest
  const { id } = req.query

  try {
    const vendor = await prisma.vendor.findFirst({
      where: { id: String(id), user: { tenantId: user.tenantId } },
    })
    if (!vendor) return notFound(res)

    if (req.method === 'GET') {
      const { page = '1', limit = '20' } = req.query
      const pageNum = Math.max(1, Number(page) || 1)
      const limitNum = Math.min(100, Math.max(1, Number(limit) || 20))

      const [payouts, total] = await Promise.all([
        prisma.payout.findMany({
          where: { vendorId: vendor.id },
          orderBy: { createdAt: 'desc' },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),
        prisma.payout.count({ where: { vendorId: vendor.id } }),
      ])

      return ok(res, { payouts, total, page: pageNum, limit: limitNum })
    }

    if (req.method === 'POST') {
      const parsed = createSchema.safeParse(req.body)
      if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

      const payout = await prisma.payout.create({
        data: {
          vendorId: vendor.id,
          amount: parsed.data.amount,
          notes: parsed.data.notes,
          status: 'PENDING',
        },
      })

      return created(res, payout)
    }

    return res.status(405).json({ success: false, error: 'Método não permitido' })
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler, 'vendors:manage')
