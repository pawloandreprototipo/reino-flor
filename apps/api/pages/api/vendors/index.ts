import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  return res.status(501).json({
    success: false,
    error: 'Vendors API not yet implemented',
  })
}
