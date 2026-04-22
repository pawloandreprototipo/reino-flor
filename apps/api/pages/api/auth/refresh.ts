import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@reino-flor/database'
import { verifyToken, generateTokenPair } from '@reino-flor/auth'
import { ok, badRequest, unauthorized, serverError } from '../../../lib/response'

const schema = z.object({ refreshToken: z.string().min(1) })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido' })
  }

  try {
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return badRequest(res, 'refreshToken obrigatório')

    const { refreshToken } = parsed.data

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    })

    if (!stored || stored.expiresAt < new Date()) {
      return unauthorized(res, 'Refresh token inválido ou expirado')
    }

    try {
      verifyToken(refreshToken)
    } catch {
      return unauthorized(res, 'Token inválido')
    }

    // Rotacionar token
    await prisma.refreshToken.delete({ where: { id: stored.id } })

    const tokens = generateTokenPair({
      sub: stored.user.id,
      tenantId: stored.user.tenantId,
      role: stored.user.role,
      email: stored.user.email,
    })

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)
    await prisma.refreshToken.create({
      data: { userId: stored.user.id, token: tokens.refreshToken, expiresAt },
    })

    return ok(res, tokens)
  } catch (e) {
    return serverError(res, e)
  }
}
