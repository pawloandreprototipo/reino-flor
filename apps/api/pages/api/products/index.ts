import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@reino-flor/database'
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth'
import { ok, created, badRequest, serverError } from '../../../lib/response'

const createSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug inválido'),
  description: z.string().optional(),
  price: z.number().positive(),
  comparePrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  sku: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).default('DRAFT'),
  featured: z.boolean().default(false),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req as AuthenticatedRequest

  // Buscar store do tenant
  const store = await prisma.store.findFirst({ where: { tenantId: user.tenantId } })
  if (!store) return badRequest(res, 'Loja não encontrada')

  try {
    if (req.method === 'GET') {
      const { page = '1', limit = '20', status, search, categoryId } = req.query

      const where: any = { storeId: store.id }
      if (status) where.status = status
      if (categoryId) where.categoryId = categoryId
      if (search) where.name = { contains: String(search), mode: 'insensitive' }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            images: { orderBy: { sortOrder: 'asc' }, take: 1 },
            category: { select: { id: true, name: true } },
            inventory: { select: { quantity: true } },
            _count: { select: { reviews: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
        }),
        prisma.product.count({ where }),
      ])

      return ok(res, { products, total, page: Number(page), limit: Number(limit) })
    }

    if (req.method === 'POST') {
      const parsed = createSchema.safeParse(req.body)
      if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

      const { name, slug, description, price, comparePrice, costPrice, sku, categoryId, status, featured } = parsed.data

      const existing = await prisma.product.findUnique({ where: { storeId_slug: { storeId: store.id, slug } } })
      if (existing) return badRequest(res, 'Slug já em uso')

      const product = await prisma.product.create({
        data: {
          storeId: store.id,
          name, slug, description, price, comparePrice, costPrice, sku, categoryId, status, featured,
          inventory: { create: { quantity: 0 } },
        },
        include: { images: true, category: true, inventory: true },
      })

      return created(res, product)
    }

    return res.status(405).json({ success: false, error: 'Método não permitido' })
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler, 'products:read')
