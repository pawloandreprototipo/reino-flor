import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@reino-flor/database'
import { hasPermission, Role } from '@reino-flor/auth'
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth'
import { ok, created, badRequest, forbidden, serverError } from '../../../lib/response'

const createSchema = z.object({
  storeName: z.string().min(2),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  bankInfo: z.any().optional(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req as AuthenticatedRequest

  try {
    if (req.method === 'GET') {
      if (!hasPermission(user.role as Role, 'vendors:manage')) {
        return forbidden(res)
      }

      const { page = '1', limit = '20' } = req.query

      const pageNum = Math.max(1, Number(page) || 1)
      const limitNum = Math.min(100, Math.max(1, Number(limit) || 20))

      const where = {
        user: { tenantId: user.tenantId },
      }

      const [vendors, total] = await Promise.all([
        prisma.vendor.findMany({
          where,
          include: {
            user: { select: { id: true, name: true, email: true } },
            _count: { select: { products: true, payouts: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),
        prisma.vendor.count({ where }),
      ])

      return ok(res, { vendors, total, page: pageNum, limit: limitNum })
    }

    if (req.method === 'POST') {
      const parsed = createSchema.safeParse(req.body)
      if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

      const { storeName, description, logoUrl, bankInfo } = parsed.data

      const existing = await prisma.vendor.findUnique({ where: { userId: user.sub } })
      if (existing) return badRequest(res, 'Usuário já é um vendedor')

      const vendor = await prisma.vendor.create({
        data: {
          userId: user.sub,
          storeName,
          description,
          logoUrl,
          bankInfo,
          status: 'PENDING',
          commissionRate: 10,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      })

      return created(res, vendor)
    }

    return res.status(405).json({ success: false, error: 'Método não permitido' })
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler)
