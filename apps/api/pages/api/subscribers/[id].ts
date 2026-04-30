import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@reino-flor/database'
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth'
import { ok, badRequest, notFound, noContent, serverError } from '../../../lib/response'

const updateSchema = z.object({
  name: z.string().optional(),
  active: z.boolean().optional(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req as AuthenticatedRequest
  const { id } = req.query

  const store = await prisma.store.findFirst({ where: { tenantId: user.tenantId } })
  if (!store) return badRequest(res, 'Loja não encontrada')

  const subscriber = await prisma.subscriber.findFirst({
    where: { id: String(id), storeId: store.id },
  })
  if (!subscriber) return notFound(res)

  try {
    if (req.method === 'GET') {
      return ok(res, subscriber)
    }

    if (req.method === 'PUT') {
      const parsed = updateSchema.safeParse(req.body)
      if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

      const updated = await prisma.subscriber.update({
        where: { id: subscriber.id },
        data: parsed.data,
      })
      return ok(res, updated)
    }

    if (req.method === 'DELETE') {
      await prisma.subscriber.delete({ where: { id: subscriber.id } })
      return noContent(res)
    }

    return res.status(405).json({ success: false, error: 'Método não permitido' })
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler, 'campaigns:manage')
