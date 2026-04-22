import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  return res.status(501).json({
    success: false,
    error: 'Affiliates API not yet implemented',
  })
}
