import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@reino-flor/database'
import { hasPermission, Role } from '@reino-flor/auth'
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth'
import { ok, created, badRequest, forbidden, serverError } from '../../../lib/response'

const createSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug inválido'),
  parentId: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req as AuthenticatedRequest
  const store = await prisma.store.findFirst({ where: { tenantId: user.tenantId } })
  if (!store) return badRequest(res, 'Loja não encontrada')

  try {
    if (req.method === 'GET') {
      const categories = await prisma.category.findMany({
        where: { storeId: store.id },
        include: {
          _count: { select: { products: true, children: true } },
          parent: { select: { id: true, name: true } },
        },
        orderBy: { sortOrder: 'asc' },
      })
      return ok(res, categories)
    }

    if (req.method === 'POST') {
      if (!hasPermission(user.role as Role, 'products:write')) return forbidden(res)

      const parsed = createSchema.safeParse(req.body)
      if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

      const { name, slug, parentId, description, imageUrl, active, sortOrder } = parsed.data

      const existing = await prisma.category.findUnique({
        where: { storeId_slug: { storeId: store.id, slug } },
      })
      if (existing) return badRequest(res, 'Slug já em uso')

      if (parentId) {
        const parent = await prisma.category.findFirst({
          where: { id: parentId, storeId: store.id },
        })
        if (!parent) return badRequest(res, 'Categoria pai não encontrada')
      }

      const category = await prisma.category.create({
        data: { storeId: store.id, name, slug, parentId, description, imageUrl, active, sortOrder },
      })
      return created(res, category)
    }

    return res.status(405).json({ success: false, error: 'Método não permitido' })
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler, 'products:read')
