import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '../../../lib/prisma'
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth'
import { created, badRequest, serverError } from '../../../lib/response'

const schema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  body: z.string().optional(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Método não permitido' })

  const { user } = req as AuthenticatedRequest

  try {
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

    const { productId, rating, title, body } = parsed.data

    const product = await prisma.product.findFirst({
      where: { id: productId, status: 'ACTIVE' },
    })
    if (!product) return badRequest(res, 'Produto não encontrado ou inativo')

    const existing = await prisma.review.findUnique({
      where: { productId_userId: { productId, userId: user.sub } },
    })
    if (existing) return badRequest(res, 'Você já avaliou este produto')

    const review = await prisma.review.create({
      data: { productId, userId: user.sub, rating, title, body, status: 'PENDING' },
    })

    return created(res, review)
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler)
