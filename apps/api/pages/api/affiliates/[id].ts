import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@reino-flor/database'
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth'
import { ok, badRequest, notFound, serverError } from '../../../lib/response'

const updateSchema = z.object({
  commissionRate: z.number().min(0).max(100).optional(),
  active: z.boolean().optional(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req as AuthenticatedRequest
  const { id } = req.query

  try {
    const affiliate = await prisma.affiliate.findFirst({
      where: {
        id: String(id),
        user: { tenantId: user.tenantId },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        clicks: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        commissions: {
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { clicks: true, commissions: true } },
      },
    })

    if (!affiliate) return notFound(res)

    if (req.method === 'GET') {
      return ok(res, affiliate)
    }

    if (req.method === 'PUT') {
      const parsed = updateSchema.safeParse(req.body)
      if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

      const updated = await prisma.affiliate.update({
        where: { id: affiliate.id },
        data: parsed.data,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      })

      return ok(res, updated)
    }

    return res.status(405).json({ success: false, error: 'Método não permitido' })
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler, 'affiliates:manage')
