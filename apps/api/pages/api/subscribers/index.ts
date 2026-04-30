import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@reino-flor/database'
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth'
import { ok, created, badRequest, conflict, serverError } from '../../../lib/response'

const createSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().optional(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req as AuthenticatedRequest

  const store = await prisma.store.findFirst({ where: { tenantId: user.tenantId } })
  if (!store) return badRequest(res, 'Loja não encontrada')

  try {
    if (req.method === 'GET') {
      const { page = '1', limit = '20', search } = req.query

      const pageNum = Math.max(1, Number(page) || 1)
      const limitNum = Math.min(100, Math.max(1, Number(limit) || 20))

      const where: any = { storeId: store.id }
      if (search) {
        where.OR = [
          { email: { contains: String(search), mode: 'insensitive' } },
          { name: { contains: String(search), mode: 'insensitive' } },
        ]
      }

      const [subscribers, total] = await Promise.all([
        prisma.subscriber.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),
        prisma.subscriber.count({ where }),
      ])

      return ok(res, { subscribers, total, page: pageNum, limit: limitNum })
    }

    if (req.method === 'POST') {
      const parsed = createSchema.safeParse(req.body)
      if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

      const { email, name } = parsed.data

      const existing = await prisma.subscriber.findFirst({
        where: { storeId: store.id, email },
      })
      if (existing) return conflict(res, 'Email já cadastrado')

      const subscriber = await prisma.subscriber.create({
        data: { storeId: store.id, email, name, active: true },
      })

      return created(res, subscriber)
    }

    return res.status(405).json({ success: false, error: 'Método não permitido' })
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler, 'campaigns:manage')
