import type { NextApiResponse } from 'next'

export function ok<T>(res: NextApiResponse, data: T, status = 200) {
  return res.status(status).json({ success: true, data })
}

export function created<T>(res: NextApiResponse, data: T) {
  return ok(res, data, 201)
}

export function noContent(res: NextApiResponse) {
  return res.status(204).end()
}

export function badRequest(res: NextApiResponse, message: string) {
  return res.status(400).json({ success: false, error: message })
}

export function unauthorized(res: NextApiResponse, message = 'Não autorizado') {
  return res.status(401).json({ success: false, error: message })
}

export function forbidden(res: NextApiResponse, message = 'Acesso negado') {
  return res.status(403).json({ success: false, error: message })
}

export function notFound(res: NextApiResponse, message = 'Não encontrado') {
  return res.status(404).json({ success: false, error: message })
}

export function conflict(res: NextApiResponse, message: string) {
  return res.status(409).json({ success: false, error: message })
}

export function serverError(res: NextApiResponse, error: unknown) {
  const message = error instanceof Error ? error.message : 'Erro interno do servidor'
  console.error('[API Error]', error)
  return res.status(500).json({ success: false, error: message })
}
