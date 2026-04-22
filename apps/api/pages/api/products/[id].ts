import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@reino-flor/database'
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth'
import { ok, badRequest, notFound, forbidden, noContent, serverError } from '../../../lib/response'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  comparePrice: z.number().positive().nullable().optional(),
  costPrice: z.number().positive().nullable().optional(),
  sku: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  featured: z.boolean().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req as AuthenticatedRequest
  const { id } = req.query

  const store = await prisma.store.findFirst({ where: { tenantId: user.tenantId } })
  if (!store) return badRequest(res, 'Loja não encontrada')

  const product = await prisma.product.findFirst({
    where: { id: String(id), storeId: store.id },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      variants: true,
      category: true,
      inventory: true,
      reviews: { where: { status: 'APPROVED' }, take: 5, orderBy: { createdAt: 'desc' } },
      _count: { select: { reviews: true, orderItems: true } },
    },
  })
  if (!product) return notFound(res)

  try {
    if (req.method === 'GET') {
      return ok(res, product)
    }

    if (req.method === 'PUT') {
      const parsed = updateSchema.safeParse(req.body)
      if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

      const updated = await prisma.product.update({
        where: { id: product.id },
        data: parsed.data,
        include: { images: true, variants: true, category: true, inventory: true },
      })
      return ok(res, updated)
    }

    if (req.method === 'DELETE') {
      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        return forbidden(res)
      }
      await prisma.product.delete({ where: { id: product.id } })
      return noContent(res)
    }

    return res.status(405).json({ success: false, error: 'Método não permitido' })
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler, 'products:read')
