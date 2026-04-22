import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@reino-flor/database'
import { hasPermission, Role } from '@reino-flor/auth'
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth'
import { ok, noContent, badRequest, notFound, forbidden, serverError } from '../../../lib/response'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug inválido').optional(),
  parentId: z.string().nullable().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req as AuthenticatedRequest
  const { id } = req.query

  const store = await prisma.store.findFirst({ where: { tenantId: user.tenantId } })
  if (!store) return badRequest(res, 'Loja não encontrada')

  const category = await prisma.category.findFirst({
    where: { id: String(id), storeId: store.id },
    include: { _count: { select: { products: true, children: true } } },
  })
  if (!category) return notFound(res)

  try {
    if (req.method === 'PUT') {
      const parsed = updateSchema.safeParse(req.body)
      if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

      if (parsed.data.slug && parsed.data.slug !== category.slug) {
        const existing = await prisma.category.findUnique({
          where: { storeId_slug: { storeId: store.id, slug: parsed.data.slug } },
        })
        if (existing) return badRequest(res, 'Slug já em uso')
      }

      const updated = await prisma.category.update({
        where: { id: category.id },
        data: parsed.data,
      })
      return ok(res, updated)
    }

    if (req.method === 'DELETE') {
      if (!hasPermission(user.role as Role, 'products:delete')) return forbidden(res)
      if (category._count.products > 0) return badRequest(res, 'Categoria possui produtos associados')
      if (category._count.children > 0) return badRequest(res, 'Categoria possui subcategorias')

      await prisma.category.delete({ where: { id: category.id } })
      return noContent(res)
    }

    return res.status(405).json({ success: false, error: 'Método não permitido' })
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler, 'products:write')
