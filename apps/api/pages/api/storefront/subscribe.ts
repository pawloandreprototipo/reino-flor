import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@reino-flor/database'
import { ok, badRequest, notFound, serverError } from '../../../lib/response'

const subscribeSchema = z.object({
  email: z.string().email('Email inválido'),
  storeSlug: z.string().min(1),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido' })
  }

  try {
    const parsed = subscribeSchema.safeParse(req.body)
    if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

    const { email, storeSlug } = parsed.data

    const store = await prisma.store.findFirst({ where: { slug: storeSlug } })
    if (!store) return notFound(res, 'Loja não encontrada')

    await prisma.subscriber.upsert({
      where: {
        storeId_email: { storeId: store.id, email },
      },
      update: { active: true },
      create: { storeId: store.id, email, active: true },
    })

    return ok(res, { message: 'Inscrito com sucesso' })
  } catch (e) {
    return serverError(res, e)
  }
}
