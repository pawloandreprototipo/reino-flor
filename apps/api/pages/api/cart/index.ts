import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@reino-flor/database'
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth'
import { ok, created, badRequest, noContent, serverError } from '../../../lib/response'

const addSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity: z.number().int().positive(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req as AuthenticatedRequest

  try {
    if (req.method === 'GET') {
      const items = await prisma.cartItem.findMany({
        where: { userId: user.sub },
        include: {
          product: {
            select: { id: true, name: true, slug: true, price: true, images: { take: 1, orderBy: { sortOrder: 'asc' } } },
          },
          variant: { select: { id: true, name: true, price: true } },
        },
        orderBy: { createdAt: 'desc' },
      })

      const total = items.reduce((sum, item) => {
        const price = item.variant ? Number(item.variant.price) : Number(item.product.price)
        return sum + price * item.quantity
      }, 0)

      return ok(res, { items, total: Math.round(total * 100) / 100, itemCount: items.length })
    }

    if (req.method === 'POST') {
      const parsed = addSchema.safeParse(req.body)
      if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

      const { productId, variantId, quantity } = parsed.data

      const product = await prisma.product.findFirst({
        where: { id: productId, status: 'ACTIVE' },
        include: { variants: true },
      })
      if (!product) return badRequest(res, 'Produto não encontrado ou inativo')

      if (variantId) {
        const variant = product.variants.find(v => v.id === variantId)
        if (!variant) return badRequest(res, 'Variante não pertence ao produto')
      }

      const existing = await prisma.cartItem.findUnique({
        where: {
          userId_productId_variantId: {
            userId: user.sub,
            productId,
            variantId: variantId ?? '',
          },
        },
      })

      if (existing) {
        const updated = await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + quantity },
        })
        return ok(res, updated)
      }

      const item = await prisma.cartItem.create({
        data: { userId: user.sub, productId, variantId: variantId ?? null, quantity },
      })
      return created(res, item)
    }

    if (req.method === 'DELETE') {
      await prisma.cartItem.deleteMany({ where: { userId: user.sub } })
      return noContent(res)
    }

    return res.status(405).json({ success: false, error: 'Método não permitido' })
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler)
