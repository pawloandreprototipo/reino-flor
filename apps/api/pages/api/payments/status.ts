import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth'
import { ok, notFound, serverError } from '../../../lib/response'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const { user } = req as AuthenticatedRequest
  const { orderId } = req.query

  try {
    const payment = await prisma.payment.findFirst({
      where: {
        orderId: String(orderId),
        order: { userId: user.sub },
      },
      select: {
        id: true,
        status: true,
        method: true,
        provider: true,
        amount: true,
        pixCode: true,
        pixExpiration: true,
        paidAt: true,
        createdAt: true,
      },
    })

    if (!payment) return notFound(res, 'Pagamento não encontrado')
    return ok(res, payment)
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler)
