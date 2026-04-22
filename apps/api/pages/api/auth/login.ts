import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@reino-flor/database'
import { comparePassword, generateTokenPair } from '@reino-flor/auth'
import { ok, badRequest, unauthorized, serverError } from '../../../lib/response'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  tenantSlug: z.string().min(1),
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

    const { email, password, tenantSlug } = parsed.data

    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
    if (!tenant || !tenant.active) return unauthorized(res, 'Loja não encontrada ou inativa')

    const user = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email } },
    })
    if (!user || !user.active) return unauthorized(res, 'Credenciais inválidas')

    const valid = await comparePassword(password, user.passwordHash)
    if (!valid) return unauthorized(res, 'Credenciais inválidas')

    const tokens = generateTokenPair({
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
    })

    // Salvar refresh token
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)
    await prisma.refreshToken.create({
      data: { userId: user.id, token: tokens.refreshToken, expiresAt },
    })

    return ok(res, {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      ...tokens,
    })
  } catch (e) {
    return serverError(res, e)
  }
}
