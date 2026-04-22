import { Worker, Job } from 'bullmq'
import { getRedisConnection } from '../redis'
import { AnalyticsJobData, QUEUE_NAMES } from '../queues'
import { prisma } from '@reino-flor/database'

export function createAnalyticsWorker(): Worker<AnalyticsJobData> {
  const worker = new Worker<AnalyticsJobData>(
    QUEUE_NAMES.ANALYTICS,
    async (job: Job<AnalyticsJobData>) => {
      const { storeId, type, sessionId, userId, data, ip, userAgent } = job.data

      await prisma.analyticsEvent.create({
        data: { storeId, type, sessionId, userId, data, ip, userAgent },
      })
    },
    {
      connection: getRedisConnection(),
      concurrency: 20,
    }
  )

  worker.on('failed', (job, err) => {
    console.error(`[AnalyticsWorker] ❌ Job ${job?.id} falhou:`, err.message)
  })

  return worker
}
