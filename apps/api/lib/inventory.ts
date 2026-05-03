import { Prisma } from '@reino-flor/database'

type TransactionClient = Prisma.TransactionClient

export class InsufficientStockError extends Error {
  productName: string
  constructor(productName: string) {
    super(`Estoque insuficiente para ${productName}`)
    this.name = 'InsufficientStockError'
    this.productName = productName
  }
}

/**
 * Reserve stock for order items (called during checkout).
 * For each item, verifies available stock (quantity - reserved >= requested)
 * and increments `reserved`. All-or-nothing: if any item fails, throws.
 */
export async function reserveStock(
  items: { productId: string; quantity: number }[],
  tx: TransactionClient
): Promise<void> {
  for (const item of items) {
    const inventory = await tx.inventory.findUnique({
      where: { productId: item.productId },
      include: { product: { select: { name: true } } },
    })

    if (!inventory) {
      throw new InsufficientStockError(item.productId)
    }

    const available = inventory.quantity - inventory.reserved
    if (available < item.quantity) {
      throw new InsufficientStockError(inventory.product.name)
    }

    await tx.inventory.update({
      where: { productId: item.productId },
      data: { reserved: { increment: item.quantity } },
    })
  }
}

/**
 * Fulfill stock after payment confirmation.
 * Decrements both `quantity` and `reserved`, creates OUT StockMovement for each item.
 */
export async function fulfillStock(
  orderId: string,
  items: { productId: string; quantity: number }[],
  tx: TransactionClient
): Promise<void> {
  for (const item of items) {
    const inventory = await tx.inventory.findUnique({
      where: { productId: item.productId },
    })

    if (!inventory) continue

    await tx.inventory.update({
      where: { productId: item.productId },
      data: {
        quantity: { decrement: item.quantity },
        reserved: { decrement: item.quantity },
      },
    })

    await tx.stockMovement.create({
      data: {
        inventoryId: inventory.id,
        type: 'OUT',
        quantity: item.quantity,
        reason: 'Fulfillment de pedido',
        orderId,
      },
    })
  }
}

/**
 * Release reserved stock on cancellation (order not yet fulfilled).
 * Decrements `reserved`, creates RETURN StockMovement for each item.
 */
export async function releaseStock(
  orderId: string,
  items: { productId: string; quantity: number }[],
  tx: TransactionClient
): Promise<void> {
  for (const item of items) {
    const inventory = await tx.inventory.findUnique({
      where: { productId: item.productId },
    })

    if (!inventory) continue

    await tx.inventory.update({
      where: { productId: item.productId },
      data: { reserved: { decrement: item.quantity } },
    })

    await tx.stockMovement.create({
      data: {
        inventoryId: inventory.id,
        type: 'RETURN',
        quantity: item.quantity,
        reason: 'Cancelamento de pedido',
        orderId,
      },
    })
  }
}

/**
 * Restore fulfilled stock on cancellation after payment (order already fulfilled).
 * Increments `quantity`, creates RETURN StockMovement for each item.
 */
export async function restoreStock(
  orderId: string,
  items: { productId: string; quantity: number }[],
  tx: TransactionClient
): Promise<void> {
  for (const item of items) {
    const inventory = await tx.inventory.findUnique({
      where: { productId: item.productId },
    })

    if (!inventory) continue

    await tx.inventory.update({
      where: { productId: item.productId },
      data: { quantity: { increment: item.quantity } },
    })

    await tx.stockMovement.create({
      data: {
        inventoryId: inventory.id,
        type: 'RETURN',
        quantity: item.quantity,
        reason: 'Restauração por cancelamento pós-pagamento',
        orderId,
      },
    })
  }
}
