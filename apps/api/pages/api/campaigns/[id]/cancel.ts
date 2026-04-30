import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@reino-flor/database'
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
    return badRequest(res, 'Campanha não pode ser cancelada no status atual')
  }

  try {
    const updated = await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'CANCELLED' },
    })

    return ok(res, updated)
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler, 'campaigns:manage')
