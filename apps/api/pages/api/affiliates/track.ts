import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@reino-flor/database'
import { ok, badRequest, notFound, serverError } from '../../../lib/response'

const schema = z.object({
  code: z.string().min(1),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Método não permitido' })

  try {
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

    const affiliate = await prisma.affiliate.findUnique({
      where: { code: parsed.data.code },
    })
    if (!affiliate || !affiliate.active) return notFound(res)

    await prisma.affiliateClick.create({
      data: {
        affiliateId: affiliate.id,
        ip: (req.headers['x-forwarded-for'] as string) ?? req.socket.remoteAddress ?? null,
        userAgent: req.headers['user-agent'] ?? null,
        referer: req.headers.referer ?? null,
      },
    })

    return ok(res, { affiliateCode: parsed.data.code })
  } catch (e) {
    return serverError(res, e)
  }
}
