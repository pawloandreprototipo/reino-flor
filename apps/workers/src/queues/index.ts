import { Queue, QueueOptions } from 'bullmq'
import { getRedisConnection } from '../redis'

function createQueue<T>(name: string, opts?: Partial<QueueOptions>): Queue<T> {
  return new Queue<T>(name, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 200 },
    },
    ...opts,
  })
}

// ─── Tipos de jobs ────────────────────────────────────────────────────────────

export interface EmailJobData {
  to: string
  subject: string
  html: string
  text?: string
}

export interface AbandonedCartJobData {
  userId: string
  tenantId: string
  cartItems: { name: string; price: number; quantity: number; imageUrl?: string }[]
  userEmail: string
  userName: string
  couponCode?: string
  recoveryUrl: string
}

export interface OrderConfirmationJobData {
  orderId: string
  userEmail: string
  userName: string
  items: { name: string; quantity: number; price: number; total: number }[]
  total: number
  paymentMethod: string
}

export interface CampaignJobData {
  campaignId: string
  subscriberEmail: string
  subscriberName?: string
  subject: string
  body: string
}

export interface AnalyticsJobData {
  storeId: string
  type: string
  sessionId?: string
  userId?: string
  data: Record<string, any>
  ip?: string
  userAgent?: string
}

// ─── Filas ────────────────────────────────────────────────────────────────────

export const emailQueue = createQueue<EmailJobData>('email')
export const abandonedCartQueue = createQueue<AbandonedCartJobData>('abandoned-cart')
export const orderConfirmationQueue = createQueue<OrderConfirmationJobData>('order-confirmation')
export const campaignQueue = createQueue<CampaignJobData>('campaign')
export const analyticsQueue = createQueue<AnalyticsJobData>('analytics')

export const QUEUE_NAMES = {
  EMAIL: 'email',
  ABANDONED_CART: 'abandoned-cart',
  ORDER_CONFIRMATION: 'order-confirmation',
  CAMPAIGN: 'campaign',
  ANALYTICS: 'analytics',
} as const
