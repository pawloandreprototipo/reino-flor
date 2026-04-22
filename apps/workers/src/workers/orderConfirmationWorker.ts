import { Worker, Job } from 'bullmq'
import { getRedisConnection } from '../redis'
import { OrderConfirmationJobData, QUEUE_NAMES, emailQueue } from '../queues'
import { orderConfirmationTemplate } from '../email/templates'

export function createOrderConfirmationWorker(): Worker<OrderConfirmationJobData> {
  const worker = new Worker<OrderConfirmationJobData>(
    QUEUE_NAMES.ORDER_CONFIRMATION,
    async (job: Job<OrderConfirmationJobData>) => {
      const { orderId, userEmail, userName, items, total, paymentMethod } = job.data

      console.log(`[OrderConfirmationWorker] Processando pedido ${orderId}`)

      const { subject, html } = orderConfirmationTemplate({
        userName,
        orderId,
        items,
        total,
        paymentMethod,
      })

      await emailQueue.add(
        `order-confirmation-${orderId}`,
        { to: userEmail, subject, html },
        { priority: 1 }
      )

      console.log(`[OrderConfirmationWorker] ✅ Email enfileirado para ${userEmail}`)
    },
    {
      connection: getRedisConnection(),
      concurrency: 5,
    }
  )

  worker.on('failed', (job, err) => {
    console.error(`[OrderConfirmationWorker] ❌ Job ${job?.id} falhou:`, err.message)
  })

  return worker
}
