import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@reino-flor/database'
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth'
import { ok, badRequest, notFound, serverError } from '../../../lib/response'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  subject: z.string().min(2).optional(),
  body: z.string().min(1).optional(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req as AuthenticatedRequest
  const { id } = req.query

  const store = await prisma.store.findFirst({ where: { tenantId: user.tenantId } })
  if (!store) return badRequest(res, 'Loja não encontrada')

  const campaign = await prisma.campaign.findFirst({
    where: { id: String(id), storeId: store.id },
  })
  if (!campaign) return notFound(res)

  try {
    if (req.method === 'GET') {
      const stats = await prisma.campaignSubscriber.aggregate({
        where: { campaignId: campaign.id },
        _count: { _all: true },
      })

      const sent = await prisma.campaignSubscriber.count({
        where: { campaignId: campaign.id, sentAt: { not: null } },
      })
      const opened = await prisma.campaignSubscriber.count({
        where: { campaignId: campaign.id, openedAt: { not: null } },
      })
      const clicked = await prisma.campaignSubscriber.count({
        where: { campaignId: campaign.id, clickedAt: { not: null } },
      })

      return ok(res, {
        ...campaign,
        _stats: {
          total: stats._count._all,
          sent,
          opened,
          clicked,
        },
      })
    }

    if (req.method === 'PUT') {
      if (campaign.status !== 'DRAFT') {
        return badRequest(res, 'Apenas campanhas em rascunho podem ser editadas')
      }

      const parsed = updateSchema.safeParse(req.body)
      if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

      const updated = await prisma.campaign.update({
        where: { id: campaign.id },
        data: parsed.data,
      })
      return ok(res, updated)
    }

    return res.status(405).json({ success: false, error: 'Método não permitido' })
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler, 'campaigns:manage')
