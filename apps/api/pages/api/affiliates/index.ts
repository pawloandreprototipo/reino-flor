import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@reino-flor/database'
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth'
import { ok, created, badRequest, serverError } from '../../../lib/response'

const createSchema = z.object({
  userId: z.string().min(1),
  code: z.string().min(2),
  commissionRate: z.number().min(0).max(100).default(5),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req as AuthenticatedRequest

  const store = await prisma.store.findFirst({ where: { tenantId: user.tenantId } })
  if (!store) return badRequest(res, 'Loja não encontrada')

  try {
    if (req.method === 'GET') {
      const { page = '1', limit = '20' } = req.query

      const pageNum = Math.max(1, Number(page) || 1)
      const limitNum = Math.min(100, Math.max(1, Number(limit) || 20))

      const where = {
        user: { tenantId: user.tenantId },
      }

      const [affiliates, total] = await Promise.all([
        prisma.affiliate.findMany({
          where,
          include: {
            user: { select: { id: true, name: true, email: true } },
            _count: { select: { clicks: true, commissions: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),
        prisma.affiliate.count({ where }),
      ])

      return ok(res, { affiliates, total, page: pageNum, limit: limitNum })
    }

    if (req.method === 'POST') {
      const parsed = createSchema.safeParse(req.body)
      if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

      const { userId, code, commissionRate } = parsed.data

      const existingCode = await prisma.affiliate.findUnique({ where: { code } })
      if (existingCode) return badRequest(res, 'Código de afiliado já existe')

      const existingUser = await prisma.affiliate.findUnique({ where: { userId } })
      if (existingUser) return badRequest(res, 'Usuário já possui perfil de afiliado')

      const targetUser = await prisma.user.findFirst({
        where: { id: userId, tenantId: user.tenantId },
      })
      if (!targetUser) return badRequest(res, 'Usuário não encontrado no tenant')

      const affiliate = await prisma.affiliate.create({
        data: { userId, code, commissionRate },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      })

      return created(res, affiliate)
    }

    return res.status(405).json({ success: false, error: 'Método não permitido' })
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler, 'affiliates:manage')
