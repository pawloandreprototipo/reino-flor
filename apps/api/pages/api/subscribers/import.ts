import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@reino-flor/database'
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth'
import { ok, badRequest, serverError } from '../../../lib/response'

export const config = {
  api: { bodyParser: { sizeLimit: '5mb' } },
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido' })
  }

  const { user } = req as AuthenticatedRequest

  const store = await prisma.store.findFirst({ where: { tenantId: user.tenantId } })
  if (!store) return badRequest(res, 'Loja não encontrada')

  try {
    const { csv } = req.body
    if (!csv || typeof csv !== 'string') {
      return badRequest(res, 'CSV não fornecido')
    }

    const lines = csv.split('\n').map((l: string) => l.trim()).filter(Boolean)
    if (lines.length === 0) return badRequest(res, 'CSV vazio')

    const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase())
    const emailIdx = headers.indexOf('email')
    if (emailIdx === -1) {
      return badRequest(res, "Coluna 'email' não encontrada no CSV")
    }
    const nameIdx = headers.indexOf('name')

    const dataRows = lines.slice(1)
    let createdCount = 0
    let skipped = 0
    const errors: { row: number; reason: string }[] = []

    // Get existing emails for this store
    const existingSubscribers = await prisma.subscriber.findMany({
      where: { storeId: store.id },
      select: { email: true },
    })
    const existingEmails = new Set(existingSubscribers.map((s) => s.email.toLowerCase()))

    const toCreate: { storeId: string; email: string; name?: string; active: boolean }[] = []

    for (let i = 0; i < dataRows.length; i++) {
      const cols = dataRows[i].split(',').map((c: string) => c.trim())
      const email = cols[emailIdx]?.toLowerCase()
      const name = nameIdx !== -1 ? cols[nameIdx] : undefined
      const rowNum = i + 2 // 1-indexed, skip header

      if (!email || !isValidEmail(email)) {
        errors.push({ row: rowNum, reason: 'Email inválido' })
        continue
      }

      if (existingEmails.has(email)) {
        skipped++
        continue
      }

      // Avoid duplicates within the CSV itself
      if (toCreate.some((r) => r.email === email)) {
        skipped++
        continue
      }

      toCreate.push({ storeId: store.id, email, name: name || undefined, active: true })
    }

    if (toCreate.length > 0) {
      await prisma.subscriber.createMany({ data: toCreate, skipDuplicates: true })
    }
    createdCount = toCreate.length

    return ok(res, { created: createdCount, skipped, errors })
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler, 'campaigns:manage')
