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

    const allInventory = await prisma.inventory.findMany({
      where: {
        product: { storeId: store.id },
      },
      include: {
        product: { select: { id: true, name: true, price: true } },
      },
    })

    // Filter where quantity <= lowStockAlert and sort by urgency (quantity - lowStockAlert) ascending
    const alerts = allInventory
      .filter(inv => inv.quantity <= inv.lowStockAlert)
      .sort((a, b) => (a.quantity - a.lowStockAlert) - (b.quantity - b.lowStockAlert))
      .map(inv => ({
        productId: inv.productId,
        productName: inv.product.name,
        quantity: inv.quantity,
        reserved: inv.reserved,
        availableStock: inv.quantity - inv.reserved,
        lowStockAlert: inv.lowStockAlert,
      }))

    return ok(res, { alerts })
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler, 'products:read')
