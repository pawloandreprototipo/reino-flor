import type { Queue } from 'bullmq'
import {
  orderConfirmationQueue,
  analyticsQueue,
} from '@reino-flor/workers'

export type {
  OrderConfirmationJobData,
  AnalyticsJobData,
} from '@reino-flor/workers'

export function getOrderConfirmationQueue(): Queue {
  return orderConfirmationQueue
}

export function getAnalyticsQueue(): Queue {
  return analyticsQueue
}
