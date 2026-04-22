import {
  orderConfirmationQueue,
  analyticsQueue,
} from '@reino-flor/workers'

export type {
  OrderConfirmationJobData,
  AnalyticsJobData,
} from '@reino-flor/workers'

export function getOrderConfirmationQueue() {
  return orderConfirmationQueue
}

export function getAnalyticsQueue() {
  return analyticsQueue
}
