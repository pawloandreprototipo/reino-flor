import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@reino-flor/database'
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth'
import { ok, serverError } from '../../../lib/response'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { user } = req as AuthenticatedRequest
    const dbUser = await prisma.user.findUnique({
      where: { id: user.sub },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true, tenantId: true },
    })
    return ok(res, dbUser)
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler)
