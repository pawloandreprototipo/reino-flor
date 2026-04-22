import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    name: 'Reino Flor API',
    version: '1.0.0',
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
}
