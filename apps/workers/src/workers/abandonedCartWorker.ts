import { Worker, Job } from 'bullmq'
import { getRedisConnection } from '../redis'
import { AbandonedCartJobData, QUEUE_NAMES, emailQueue } from '../queues'
import { abandonedCartTemplate } from '../email/templates'

export function createAbandonedCartWorker(): Worker<AbandonedCartJobData> {
  const worker = new Worker<AbandonedCartJobData>(
    QUEUE_NAMES.ABANDONED_CART,
    async (job: Job<AbandonedCartJobData>) => {
      const { userId, userEmail, userName, cartItems, couponCode, recoveryUrl } = job.data

      console.log(`[AbandonedCartWorker] Processando carrinho de ${userEmail}`)

      if (cartItems.length === 0) {
        console.log(`[AbandonedCartWorker] Carrinho vazio, ignorando`)
        return
      }

      const { subject, html } = abandonedCartTemplate({
        userName,
        items: cartItems,
        couponCode,
        recoveryUrl,
      })

      await emailQueue.add(
        `abandoned-cart-email-${userId}`,
        { to: userEmail, subject, html },
        { priority: 2 }
      )

      console.log(`[AbandonedCartWorker] ✅ Email enfileirado para ${userEmail}`)
    },
    {
      connection: getRedisConnection(),
      concurrency: 3,
    }
  )

  worker.on('failed', (job, err) => {
    console.error(`[AbandonedCartWorker] ❌ Job ${job?.id} falhou:`, err.message)
  })

  return worker
}
