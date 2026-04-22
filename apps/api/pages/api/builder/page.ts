import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '../../../lib/prisma'
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth'
import { ok, badRequest, serverError } from '../../../lib/response'

const sectionSchema = z.object({
  id: z.string(),
  type: z.enum(['hero', 'product_grid', 'banner', 'testimonials', 'newsletter']),
  order: z.number().int().min(0),
  props: z.record(z.any()),
})

const bodySchema = z.object({
  pageSlug: z.string().default('home'),
  sections: z.array(sectionSchema),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user } = req as AuthenticatedRequest

  const store = await prisma.store.findFirst({ where: { tenantId: user.tenantId } })
  if (!store) return badRequest(res, 'Loja não encontrada')

  try {
    if (req.method === 'GET') {
      const { pageSlug = 'home' } = req.query
      const page = await prisma.storePage.findUnique({
        where: { storeId_slug: { storeId: store.id, slug: String(pageSlug) } },
      })
      return ok(res, page ?? { sections: [] })
    }

    if (req.method === 'PUT') {
      const parsed = bodySchema.safeParse(req.body)
      if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

      const { pageSlug, sections } = parsed.data

      const page = await prisma.storePage.upsert({
        where: { storeId_slug: { storeId: store.id, slug: pageSlug } },
        update: { sections, updatedAt: new Date() },
        create: {
          storeId: store.id,
          slug: pageSlug,
          title: pageSlug === 'home' ? 'Página Inicial' : pageSlug,
          isHome: pageSlug === 'home',
          published: true,
          sections,
        },
      })
      return ok(res, page)
    }

    return res.status(405).json({ success: false, error: 'Método não permitido' })
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler, 'settings:write')
