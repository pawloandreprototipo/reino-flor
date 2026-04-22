import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@reino-flor/database'
import { hashPassword, validatePasswordStrength, generateTokenPair } from '@reino-flor/auth'
import { created, badRequest, conflict, serverError } from '../../../lib/response'

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8),
  tenantSlug: z.string().min(2),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido' })
  }

  try {
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) {
      return badRequest(res, parsed.error.errors[0].message)
    }

    const { name, email, password, tenantSlug } = parsed.data

    const strength = validatePasswordStrength(password)
    if (!strength.valid) return badRequest(res, strength.message!)

    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
    if (!tenant) return badRequest(res, 'Loja não encontrada')

    const existing = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email } },
    })
    if (existing) return conflict(res, 'E-mail já cadastrado')

    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
      data: { tenantId: tenant.id, email, passwordHash, name },
      select: { id: true, name: true, email: true, role: true, tenantId: true },
    })

    const tokens = generateTokenPair({
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
    })

    return created(res, { user, ...tokens })
  } catch (e) {
    return serverError(res, e)
  }
}
