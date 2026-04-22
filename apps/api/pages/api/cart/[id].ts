import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@reino-flor/database'
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth'
import { ok, badRequest, notFound, noContent, serverError } from '../../../lib/response'

const updateSchema = z.object({
  quantity: z.number().int().positive(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req as AuthenticatedRequest
  const { id } = req.query

  try {
    const item = await prisma.cartItem.findFirst({
      where: { id: String(id), userId: user.sub },
    })
    if (!item) return notFound(res)

    if (req.method === 'PUT') {
      const parsed = updateSchema.safeParse(req.body)
      if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

      const updated = await prisma.cartItem.update({
        where: { id: item.id },
        data: { quantity: parsed.data.quantity },
      })
      return ok(res, updated)
    }

    if (req.method === 'DELETE') {
      await prisma.cartItem.delete({ where: { id: item.id } })
      return noContent(res)
    }

    return res.status(405).json({ success: false, error: 'Método não permitido' })
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler)
