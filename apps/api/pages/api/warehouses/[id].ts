import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@reino-flor/database'
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth'
import { ok, noContent, badRequest, notFound, conflict, serverError } from '../../../lib/response'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  address: z.string().min(2).optional(),
  city: z.string().min(2).optional(),
  state: z.string().min(2).optional(),
  zipCode: z.string().min(5).optional(),
  active: z.boolean().optional(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  try {
    if (req.method === 'PUT') {
      const warehouse = await prisma.warehouse.findUnique({ where: { id: String(id) } })
      if (!warehouse) return notFound(res, 'Armazém não encontrado')

      const parsed = updateSchema.safeParse(req.body)
      if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

      const updated = await prisma.warehouse.update({
        where: { id: String(id) },
        data: parsed.data,
      })
      return ok(res, updated)
    }

    if (req.method === 'DELETE') {
      const warehouse = await prisma.warehouse.findUnique({ where: { id: String(id) } })
      if (!warehouse) return notFound(res, 'Armazém não encontrado')

      // Check if warehouse has assigned inventory
      const inventoryCount = await prisma.inventory.count({
        where: { warehouseId: String(id) },
      })
      if (inventoryCount > 0) {
        return conflict(res, 'Armazém possui inventário atribuído')
      }

      await prisma.warehouse.delete({ where: { id: String(id) } })
      return noContent(res)
    }

    return res.status(405).json({ success: false, error: 'Método não permitido' })
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler, 'products:write')
