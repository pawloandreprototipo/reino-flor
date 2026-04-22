import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next'
import { verifyToken, hasPermission, JwtPayload, Role } from '@reino-flor/auth'
import { unauthorized, forbidden, serverError } from '../lib/response'

export interface AuthenticatedRequest extends NextApiRequest {
  user: JwtPayload
}

type Permission = Parameters<typeof hasPermission>[1]

export function withAuth(handler: NextApiHandler, requiredPermission?: Permission) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const authHeader = req.headers.authorization
      if (!authHeader?.startsWith('Bearer ')) {
        return unauthorized(res)
      }

      const token = authHeader.slice(7)
      const payload = verifyToken(token)

      if (requiredPermission && !hasPermission(payload.role as Role, requiredPermission)) {
        return forbidden(res)
      }

      ;(req as AuthenticatedRequest).user = payload
      return handler(req, res)
    } catch {
      return unauthorized(res, 'Token inválido ou expirado')
    }
  }
}

export function withMethods(handler: NextApiHandler, methods: string[]) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    if (!methods.includes(req.method ?? '')) {
      res.setHeader('Allow', methods)
      return res.status(405).json({ success: false, error: 'Método não permitido' })
    }
    return handler(req, res)
  }
}
