import { Worker, Job } from 'bullmq'
import { getRedisConnection } from '../redis'
import { EmailJobData, QUEUE_NAMES } from '../queues'
import { sendEmail } from '../email/sender'

export function createEmailWorker(): Worker<EmailJobData> {
  const worker = new Worker<EmailJobData>(
    QUEUE_NAMES.EMAIL,
    async (job: Job<EmailJobData>) => {
      const { to, subject, html, text } = job.data
      console.log(`[EmailWorker] Enviando para ${to}: ${subject}`)
      await sendEmail({ to, subject, html, text })
      console.log(`[EmailWorker] ✅ Enviado para ${to}`)
    },
    {
      connection: getRedisConnection(),
      concurrency: 5,
    }
  )

  worker.on('failed', (job, err) => {
    console.error(`[EmailWorker] ❌ Job ${job?.id} falhou:`, err.message)
  })

  return worker
}
