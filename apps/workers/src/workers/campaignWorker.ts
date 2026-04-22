import { Worker, Job } from 'bullmq'
import { getRedisConnection } from '../redis'
import { CampaignJobData, QUEUE_NAMES, emailQueue } from '../queues'
import { campaignTemplate } from '../email/templates'
import { prisma } from '@reino-flor/database'

export function createCampaignWorker(): Worker<CampaignJobData> {
  const worker = new Worker<CampaignJobData>(
    QUEUE_NAMES.CAMPAIGN,
    async (job: Job<CampaignJobData>) => {
      const { campaignId, subscriberEmail, subscriberName, subject, body } = job.data

      console.log(`[CampaignWorker] Enviando campanha ${campaignId} para ${subscriberEmail}`)

      const { html } = campaignTemplate({ subject, body, subscriberName })

      await emailQueue.add(
        `campaign-${campaignId}-${subscriberEmail}`,
        { to: subscriberEmail, subject, html },
        { priority: 3 }
      )

      // Registrar envio
      await prisma.campaignSubscriber.updateMany({
        where: {
          campaignId,
          subscriber: { email: subscriberEmail },
        },
        data: { sentAt: new Date() },
      })

      console.log(`[CampaignWorker] ✅ Campanha enfileirada para ${subscriberEmail}`)
    },
    {
      connection: getRedisConnection(),
      concurrency: 10,
    }
  )

  worker.on('failed', (job, err) => {
    console.error(`[CampaignWorker] ❌ Job ${job?.id} falhou:`, err.message)
  })

  return worker
}
