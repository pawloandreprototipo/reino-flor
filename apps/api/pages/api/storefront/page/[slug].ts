import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../lib/prisma'
import { ok, notFound, serverError } from '../../../../lib/response'

const STORE_SLUG = process.env.NEXT_PUBLIC_STORE_SLUG ?? 'reino-flor-store'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query

  try {
    const store = await prisma.store.findUnique({ where: { slug: STORE_SLUG } })
    if (!store) return notFound(res)

    const page = await prisma.storePage.findUnique({
      where: { storeId_slug: { storeId: store.id, slug: String(slug) } },
    })
    if (!page) return notFound(res)

    return ok(res, page)
  } catch (e) {
    return serverError(res, e)
  }
}
