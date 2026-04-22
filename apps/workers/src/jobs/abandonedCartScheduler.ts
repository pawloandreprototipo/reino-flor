import { prisma } from '@reino-flor/database'
import { abandonedCartQueue } from '../queues'

const STOREFRONT_URL = process.env.STOREFRONT_URL ?? 'http://localhost:3000'
const ABANDONED_AFTER_MINUTES = 30

export async function scheduleAbandonedCarts(): Promise<void> {
  const cutoff = new Date(Date.now() - ABANDONED_AFTER_MINUTES * 60 * 1000)

  // Buscar usuários com itens no carrinho há mais de 30 min sem pedido recente
  const usersWithCarts = await prisma.cartItem.findMany({
    where: { updatedAt: { lte: cutoff } },
    include: {
      user: { select: { id: true, name: true, email: true, tenantId: true } },
      product: { select: { name: true, price: true, images: { take: 1 } } },
    },
    distinct: ['userId'],
  })

  // Agrupar por usuário
  const byUser = new Map<string, typeof usersWithCarts>()
  for (const item of usersWithCarts) {
    const existing = byUser.get(item.userId) ?? []
    existing.push(item)
    byUser.set(item.userId, existing)
  }

  let scheduled = 0

  for (const [userId, items] of byUser) {
    const user = items[0].user

    // Verificar se já tem pedido recente (últimas 2h)
    const recentOrder = await prisma.order.findFirst({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      },
    })
    if (recentOrder) continue

    // Verificar se já foi enviado nas últimas 24h (evitar spam)
    const jobId = `abandoned-cart-${userId}`
    const existingJob = await abandonedCartQueue.getJob(jobId)
    if (existingJob) continue

    const cartItems = items.map(i => ({
      name: i.product.name,
      price: Number(i.product.price),
      quantity: i.quantity,
      imageUrl: i.product.images[0]?.url,
    }))

    await abandonedCartQueue.add(
      jobId,
      {
        userId,
        tenantId: user.tenantId,
        userEmail: user.email,
        userName: user.name,
        cartItems,
        couponCode: 'VOLTEI10',
        recoveryUrl: `${STOREFRONT_URL}/carrinho`,
      },
      {
        jobId,
        delay: 0,
        removeOnComplete: true,
      }
    )

    scheduled++
  }

  console.log(`[AbandonedCartScheduler] ${scheduled} carrinhos agendados`)
}
