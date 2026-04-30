import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@reino-flor/database'
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth'
import { ok, created, badRequest, serverError } from '../../../lib/response'

const createSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  subject: z.string().min(2, 'Assunto deve ter pelo menos 2 caracteres'),
  body: z.string().min(1, 'Corpo do email é obrigatório'),
  scheduledAt: z.string().datetime().optional().refine(
    (val) => !val || new Date(val) > new Date(),
    'Data de agendamento deve ser no futuro'
  ),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req as AuthenticatedRequest

  const store = await prisma.store.findFirst({ where: { tenantId: user.tenantId } })
  if (!store) return badRequest(res, 'Loja não encontrada')

  try {
    if (req.method === 'GET') {
      const { page = '1', limit = '20', status } = req.query

      const pageNum = Math.max(1, Number(page) || 1)
      const limitNum = Math.min(100, Math.max(1, Number(limit) || 20))

      const where: any = { storeId: store.id }
      if (status) where.status = String(status)

      const [campaigns, total] = await Promise.all([
        prisma.campaign.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),
        prisma.campaign.count({ where }),
      ])

      return ok(res, { campaigns, total, page: pageNum, limit: limitNum })
    }

    if (req.method === 'POST') {
      const parsed = createSchema.safeParse(req.body)
      if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

      const { name, subject, body, scheduledAt } = parsed.data

      const campaign = await prisma.campaign.create({
        data: {
          storeId: store.id,
          name,
          subject,
          body,
          status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          sentCount: 0,
        },
      })

      return created(res, campaign)
    }

    return res.status(405).json({ success: false, error: 'Método não permitido' })
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler, 'campaigns:manage')
