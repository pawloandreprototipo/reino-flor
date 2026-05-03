import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@reino-flor/database'
import { withAuth, AuthenticatedRequest } from '../../../../middleware/auth'
import { ok, badRequest, notFound, serverError } from '../../../../lib/response'

const adjustSchema = z.object({
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantity: z.number().int().positive(),
  reason: z.string().optional(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido' })
  }

  const { user } = req as AuthenticatedRequest
  const { productId } = req.query

  try {
    const store = await prisma.store.findFirst({ where: { tenantId: user.tenantId } })
    if (!store) return badRequest(res, 'Loja não encontrada')

    const inventory = await prisma.inventory.findUnique({
      where: { productId: String(productId) },
      include: { product: { select: { storeId: true } } },
    })

    if (!inventory || inventory.product.storeId !== store.id) {
      return notFound(res, 'Inventário não encontrado')
    }

    const parsed = adjustSchema.safeParse(req.body)
    if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

    const { type, quantity, reason } = parsed.data

    // Validate OUT won't go negative
    if (type === 'OUT' && inventory.quantity < quantity) {
      return badRequest(res, 'Estoque insuficiente para esta operação')
    }

    const result = await prisma.$transaction(async (tx) => {
      let newQuantity: number
      let movementQty: number

      if (type === 'IN') {
        newQuantity = inventory.quantity + quantity
        movementQty = quantity
      } else if (type === 'OUT') {
        newQuantity = inventory.quantity - quantity
        movementQty = quantity
      } else {
        // ADJUSTMENT: set to the specified value
        newQuantity = quantity
        movementQty = Math.abs(quantity - inventory.quantity)
      }

      const updated = await tx.inventory.update({
        where: { productId: String(productId) },
        data: { quantity: newQuantity },
      })

      const movement = await tx.stockMovement.create({
        data: {
          inventoryId: inventory.id,
          type,
          quantity: movementQty,
          reason: reason ?? null,
        },
      })

      return { inventory: updated, movement }
    })

    return ok(res, {
      productId: result.inventory.productId,
      quantity: result.inventory.quantity,
      reserved: result.inventory.reserved,
      availableStock: result.inventory.quantity - result.inventory.reserved,
      movement: result.movement,
    })
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler, 'products:write')
