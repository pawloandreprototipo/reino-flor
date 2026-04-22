import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@reino-flor/database'
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth'
import { ok, badRequest, serverError } from '../../../lib/response'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Método não permitido' })
  }

  const { user } = req as AuthenticatedRequest

  const store = await prisma.store.findFirst({ where: { tenantId: user.tenantId } })
  if (!store) return badRequest(res, 'Loja não encontrada')

  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    const [
      totalOrders,
      monthOrders,
      lastMonthOrders,
      revenueResult,
      lastMonthRevenueResult,
      totalCustomers,
      pendingOrders,
      topProducts,
    ] = await Promise.all([
      prisma.order.count({ where: { storeId: store.id } }),
      prisma.order.count({ where: { storeId: store.id, createdAt: { gte: startOfMonth } } }),
      prisma.order.count({ where: { storeId: store.id, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      prisma.order.aggregate({
        where: { storeId: store.id, payment: { status: 'PAID' } },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: { storeId: store.id, payment: { status: 'PAID' }, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { total: true },
      }),
      prisma.user.count({ where: { tenantId: user.tenantId, role: 'CUSTOMER' } }),
      prisma.order.count({ where: { storeId: store.id, status: 'PENDING' } }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: { order: { storeId: store.id } },
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 5,
      }),
    ])

    const revenue = Number(revenueResult._sum.total ?? 0)
    const lastMonthRevenue = Number(lastMonthRevenueResult._sum.total ?? 0)
    const revenueGrowth = lastMonthRevenue > 0
      ? ((revenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0

    const ordersGrowth = lastMonthOrders > 0
      ? ((monthOrders - lastMonthOrders) / lastMonthOrders) * 100
      : 0

    // Buscar nomes dos top produtos
    const topProductIds = topProducts.map(p => p.productId)
    const productNames = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true },
    })

    const topProductsWithNames = topProducts.map(p => ({
      ...p,
      name: productNames.find(n => n.id === p.productId)?.name ?? 'Produto',
      revenue: Number(p._sum.total ?? 0),
      quantity: p._sum.quantity ?? 0,
    }))

    return ok(res, {
      overview: {
        totalOrders,
        monthOrders,
        ordersGrowth: Math.round(ordersGrowth * 10) / 10,
        revenue,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        totalCustomers,
        pendingOrders,
      },
      topProducts: topProductsWithNames,
    })
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler, 'analytics:read')
