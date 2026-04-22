import 'dotenv/config'
import { createEmailWorker } from './workers/emailWorker'
import { createAbandonedCartWorker } from './workers/abandonedCartWorker'
import { createOrderConfirmationWorker } from './workers/orderConfirmationWorker'
import { createCampaignWorker } from './workers/campaignWorker'
import { createAnalyticsWorker } from './workers/analyticsWorker'
import { scheduleAbandonedCarts } from './jobs/abandonedCartScheduler'
import { closeRedisConnection } from './redis'

async function main() {
  console.log('🚀 Iniciando workers do Reino Flor...')

  const workers = [
    createEmailWorker(),
    createAbandonedCartWorker(),
    createOrderConfirmationWorker(),
    createCampaignWorker(),
    createAnalyticsWorker(),
  ]

  console.log(`✅ ${workers.length} workers iniciados`)

  // Rodar scheduler de carrinho abandonado a cada 5 minutos
  await scheduleAbandonedCarts()
  const schedulerInterval = setInterval(scheduleAbandonedCarts, 5 * 60 * 1000)

  console.log('⏰ Scheduler de carrinho abandonado ativo (a cada 5 min)')

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n[Workers] Recebido ${signal}, encerrando...`)
    clearInterval(schedulerInterval)
    await Promise.all(workers.map(w => w.close()))
    await closeRedisConnection()
    console.log('[Workers] Encerrado com sucesso')
    process.exit(0)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

main().catch((err) => {
  console.error('❌ Erro fatal nos workers:', err)
  process.exit(1)
})
