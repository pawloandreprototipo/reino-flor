import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@reino-flor/database'
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth'
import { created, badRequest, serverError } from '../../../lib/response'
import { getOrderConfirmationQueue } from '../../../lib/queues'
import { reserveStock, InsufficientStockError } from '../../../lib/inventory'

const schema = z.object({
  storeSlug: z.string(),
  addressId: z.string().optional(),
  couponCode: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string().optional(),
    quantity: z.number().int().positive(),
  })).min(1),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BOLETO', 'WALLET']),
  shippingCost: z.number().min(0).default(0),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido' })
  }

  const { user } = req as AuthenticatedRequest

  try {
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

    const { storeSlug, addressId, couponCode, items, paymentMethod, shippingCost } = parsed.data

    const store = await prisma.store.findUnique({ where: { slug: storeSlug } })
    if (!store || !store.active) return badRequest(res, 'Loja não encontrada')

    // Buscar produtos e calcular subtotal
    const productIds = items.map(i => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, storeId: store.id, status: 'ACTIVE' },
      include: { variants: true, inventory: true },
    })

    if (products.length !== productIds.length) {
      return badRequest(res, 'Um ou mais produtos não encontrados ou inativos')
    }

    let subtotal = 0
    const orderItems = items.map(item => {
      const product = products.find(p => p.id === item.productId)!
      const variant = item.variantId ? product.variants.find(v => v.id === item.variantId) : null
      const price = Number(variant?.price ?? product.price)
      const total = price * item.quantity
      subtotal += total

      return {
        productId: product.id,
        variantId: item.variantId ?? null,
        name: product.name + (variant ? ` - ${variant.name}` : ''),
        sku: variant?.sku ?? product.sku ?? null,
        price,
        quantity: item.quantity,
        total,
      }
    })

    // Aplicar cupom
    let discount = 0
    let couponId: string | null = null
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { storeId_code: { storeId: store.id, code: couponCode } },
      })
      if (coupon && coupon.active && (!coupon.expiresAt || coupon.expiresAt > new Date())) {
        if (!coupon.minOrderValue || subtotal >= Number(coupon.minOrderValue)) {
          discount = coupon.type === 'PERCENTAGE'
            ? subtotal * (Number(coupon.value) / 100)
            : Number(coupon.value)
          couponId = coupon.id
        }
      }
    }

    const total = subtotal - discount + shippingCost

    // Wrap stock reservation + order creation in a single transaction
    let order: any
    try {
      order = await prisma.$transaction(async (tx) => {
        // Reserve stock for all items
        await reserveStock(
          items.map(item => ({ productId: item.productId, quantity: item.quantity })),
          tx
        )

        // Update coupon usage inside transaction
        if (couponId) {
          await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } })
        }

        // Create order
        const newOrder = await tx.order.create({
          data: {
            storeId: store.id,
            userId: user.sub,
            addressId: addressId ?? null,
            couponId,
            subtotal,
            discount,
            shippingCost,
            total,
            items: { create: orderItems },
            payment: {
              create: {
                provider: paymentMethod === 'PIX' ? 'PIX' : 'STRIPE',
                method: paymentMethod,
                amount: total,
                status: 'PENDING',
              },
            },
          },
          include: {
            items: true,
            payment: true,
          },
        })

        return newOrder
      })
    } catch (e) {
      if (e instanceof InsufficientStockError) {
        return badRequest(res, e.message)
      }
      throw e
    }

    // Limpar carrinho do usuário
    await prisma.cartItem.deleteMany({ where: { userId: user.sub } })

    // Enfileirar email de confirmação
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.sub },
        select: { name: true, email: true },
      })
      if (dbUser) {
        await getOrderConfirmationQueue().add(
          `order-confirmation-${order.id}`,
          {
            orderId: order.id,
            userEmail: dbUser.email,
            userName: dbUser.name,
            items: order.items.map((i: any) => ({
              name: i.name,
              quantity: i.quantity,
              price: Number(i.price),
              total: Number(i.total),
            })),
            total: Number(order.total),
            paymentMethod,
          }
        )
      }
    } catch (queueErr) {
      console.warn('[Checkout] Falha ao enfileirar email:', queueErr)
    }

    return created(res, order)
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler)
