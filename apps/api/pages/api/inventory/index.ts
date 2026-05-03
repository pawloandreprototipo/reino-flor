import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@reino-flor/database'
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth'
import { ok, badRequest, serverError } from '../../../lib/response'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Método não permitido' })
  }

  const { user } = req as AuthenticatedRequest

  try {
    const store = await prisma.store.findFirst({ where: { tenantId: user.tenantId } })
    if (!store) return badRequest(res, 'Loja não encontrada')

    const { page = '1', limit = '20', search, warehouseId, lowStock } = req.query

    const pageNum = Number(page)
    const limitNum = Number(limit)

    const where: any = {
      product: { storeId: store.id },
    }

    if (search) {
      where.product.name = { contains: String(search), mode: 'insensitive' }
    }

    if (warehouseId) {
      where.warehouseId = String(warehouseId)
    }

    if (lowStock === 'true') {
      where.quantity = { lte: prisma.inventory.fields.lowStockAlert }
    }

    // For lowStock filter we need raw filtering since Prisma doesn't support field-to-field comparison easily
    let inventoryItems: any[]
    let total: number

    if (lowStock === 'true') {
      // Use raw approach: fetch all then filter, or use Prisma's where with a workaround
      const baseWhere: any = {
        product: { storeId: store.id },
      }
      if (search) {
        baseWhere.product.name = { contains: String(search), mode: 'insensitive' }
      }
      if (warehouseId) {
        baseWhere.warehouseId = String(warehouseId)
      }

      const allItems = await prisma.inventory.findMany({
        where: baseWhere,
        include: {
          product: { select: { id: true, name: true, price: true, images: { take: 1, orderBy: { sortOrder: 'asc' } } } },
          warehouse: { select: { id: true, name: true } },
        },
        orderBy: { product: { name: 'asc' } },
      })

      const filtered = allItems.filter(inv => inv.quantity <= inv.lowStockAlert)
      total = filtered.length
      inventoryItems = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum)
    } else {
      const baseWhere: any = {
        product: { storeId: store.id },
      }
      if (search) {
        baseWhere.product.name = { contains: String(search), mode: 'insensitive' }
      }
      if (warehouseId) {
        baseWhere.warehouseId = String(warehouseId)
      }

      ;[inventoryItems, total] = await Promise.all([
        prisma.inventory.findMany({
          where: baseWhere,
          include: {
            product: { select: { id: true, name: true, price: true, images: { take: 1, orderBy: { sortOrder: 'asc' } } } },
            warehouse: { select: { id: true, name: true } },
          },
          orderBy: { product: { name: 'asc' } },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),
        prisma.inventory.count({ where: baseWhere }),
      ])
    }

    const data = inventoryItems.map(inv => ({
      productId: inv.productId,
      productName: inv.product.name,
      productPrice: inv.product.price,
      productImage: inv.product.images[0]?.url ?? null,
      quantity: inv.quantity,
      reserved: inv.reserved,
      availableStock: inv.quantity - inv.reserved,
      lowStockAlert: inv.lowStockAlert,
      warehouseId: inv.warehouseId,
      warehouseName: inv.warehouse?.name ?? null,
    }))

    return ok(res, { items: data, total, page: pageNum, limit: limitNum })
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler, 'products:read')
