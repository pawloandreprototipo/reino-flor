import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@reino-flor/database'
import { campaignQueue } from '@reino-flor/workers'
import { withAuth, AuthenticatedRequest } from '../../../../middleware/auth'
import { ok, badRequest, notFound, serverError } from '../../../../lib/response'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido' })
  }

  const { user } = req as AuthenticatedRequest
  const { id } = req.query

  const store = await prisma.store.findFirst({ where: { tenantId: user.tenantId } })
  if (!store) return badRequest(res, 'Loja não encontrada')

  const campaign = await prisma.campaign.findFirst({
    where: { id: String(id), storeId: store.id },
  })
  if (!campaign) return notFound(res)

  if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
    return badRequest(res, 'Campanha não pode ser enviada no status atual')
  }

  try {
    const subscribers = await prisma.subscriber.findMany({
      where: { storeId: store.id, active: true },
    })

    if (subscribers.length === 0) {
      return badRequest(res, 'Nenhum assinante ativo encontrado')
    }

    // Create CampaignSubscriber records
    await prisma.campaignSubscriber.createMany({
      data: subscribers.map((s) => ({
        campaignId: campaign.id,
        subscriberId: s.id,
      })),
      skipDuplicates: true,
    })

    // Update campaign status
    const updated = await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: 'SENDING',
        sentAt: new Date(),
        sentCount: subscribers.length,
      },
    })

    // Enqueue one job per subscriber
    for (const sub of subscribers) {
      await campaignQueue.add(`campaign-${campaign.id}-${sub.id}`, {
        campaignId: campaign.id,
        subscriberEmail: sub.email,
        subscriberName: sub.name ?? undefined,
        subject: campaign.subject,
        body: campaign.body,
      })
    }

    return ok(res, updated)
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler, 'campaigns:manage')
