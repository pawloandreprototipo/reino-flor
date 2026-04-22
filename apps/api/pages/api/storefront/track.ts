import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { getAnalyticsQueue } from '../../../lib/queues'
import { prisma } from '../../../lib/prisma'

const schema = z.object({
  storeSlug: z.string(),
  type: z.string(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
  data: z.record(z.any()).default({}),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ success: false })

    const { storeSlug, type, sessionId, userId, data } = parsed.data

    const store = await prisma.store.findUnique({ where: { slug: storeSlug } })
    if (!store) return res.status(202).json({ success: true })

    await getAnalyticsQueue().add(`analytics-${type}-${Date.now()}`, {
      storeId: store.id,
      type,
      sessionId,
      userId,
      data,
      ip: req.headers['x-forwarded-for'] as string ?? req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    })

    return res.status(202).json({ success: true })
  } catch {
    return res.status(202).json({ success: true }) // Nunca falha para o cliente
  }
}
