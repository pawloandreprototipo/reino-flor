import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@reino-flor/database'
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth'
import { ok, badRequest, notFound, serverError } from '../../../lib/response'

const updateSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
  trackingCode: z.string().optional(),
  notes: z.string().optional(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req as AuthenticatedRequest
  const { id } = req.query

  const store = await prisma.store.findFirst({ where: { tenantId: user.tenantId } })
  if (!store) return badRequest(res, 'Loja não encontrada')

  const order = await prisma.order.findFirst({
    where: { id: String(id), storeId: store.id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      address: true,
      items: {
        include: {
          product: { select: { id: true, name: true, slug: true } },
          variant: { select: { id: true, name: true, options: true } },
        },
      },
      payment: true,
      shipment: true,
      coupon: { select: { code: true, type: true, value: true } },
    },
  })
  if (!order) return notFound(res)

  try {
    if (req.method === 'GET') {
      return ok(res, order)
    }

    if (req.method === 'PUT') {
      const parsed = updateSchema.safeParse(req.body)
      if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

      const updated = await prisma.order.update({
        where: { id: order.id },
        data: parsed.data,
      })
      return ok(res, updated)
    }

    return res.status(405).json({ success: false, error: 'Método não permitido' })
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler, 'orders:read')
