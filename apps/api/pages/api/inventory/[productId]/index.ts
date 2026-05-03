import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@reino-flor/database'
import { withAuth, AuthenticatedRequest } from '../../../../middleware/auth'
import { ok, badRequest, notFound, serverError } from '../../../../lib/response'

const updateSchema = z.object({
  lowStockAlert: z.number().int().min(0).optional(),
  warehouseId: z.string().nullable().optional(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
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

    const parsed = updateSchema.safeParse(req.body)
    if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

    const { lowStockAlert, warehouseId } = parsed.data

    // Validate warehouse if provided
    if (warehouseId) {
      const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } })
      if (!warehouse || !warehouse.active) {
        return badRequest(res, 'Armazém não encontrado ou inativo')
      }
    }

    const updated = await prisma.inventory.update({
      where: { productId: String(productId) },
      data: {
        ...(lowStockAlert !== undefined && { lowStockAlert }),
        ...(warehouseId !== undefined && { warehouseId }),
      },
      include: {
        product: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
      },
    })

    return ok(res, {
      productId: updated.productId,
      quantity: updated.quantity,
      reserved: updated.reserved,
      availableStock: updated.quantity - updated.reserved,
      lowStockAlert: updated.lowStockAlert,
      warehouseId: updated.warehouseId,
      warehouseName: updated.warehouse?.name ?? null,
    })
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler, 'products:write')
