import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      },
    })
  }

  const res = NextResponse.next()
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  return res
}

export const config = {
  matcher: '/api/:path*',
}
