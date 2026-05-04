import type { NextApiRequest, NextApiResponse } from 'next'

export function withCors(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')

    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }

    return handler(req, res)
  }
}
