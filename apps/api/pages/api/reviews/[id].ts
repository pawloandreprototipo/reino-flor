import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@reino-flor/database'
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth'
import { ok, badRequest, notFound, serverError } from '../../../lib/response'

const updateSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') return res.status(405).json({ success: false, error: 'Método não permitido' })

  const { user } = req as AuthenticatedRequest
  const { id } = req.query

  try {
    const review = await prisma.review.findFirst({
      where: { id: String(id), product: { store: { tenantId: user.tenantId } } },
    })
    if (!review) return notFound(res)

    const parsed = updateSchema.safeParse(req.body)
    if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

    const updated = await prisma.review.update({
      where: { id: review.id },
      data: { status: parsed.data.status },
      include: {
        product: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    })

    return ok(res, updated)
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler, 'products:write')
