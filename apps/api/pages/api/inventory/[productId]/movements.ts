import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@reino-flor/database'
import { withAuth, AuthenticatedRequest } from '../../../../middleware/auth'
import { ok, badRequest, notFound, serverError } from '../../../../lib/response'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Método não permitido' })
  }

  const { user } = req as AuthenticatedRequest
  const { productId, page = '1', limit = '20', type } = req.query

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

    const pageNum = Number(page)
    const limitNum = Number(limit)

    const where: any = { inventoryId: inventory.id }
    if (type && ['IN', 'OUT', 'ADJUSTMENT', 'RETURN'].includes(String(type))) {
      where.type = String(type)
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.stockMovement.count({ where }),
    ])

    return ok(res, { movements, total, page: pageNum, limit: limitNum })
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler, 'products:read')
