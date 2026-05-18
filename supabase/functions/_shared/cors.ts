const ALLOWED_ORIGINS = [
  'https://flaro.app',
  'https://www.flaro.app',
  'http://localhost:5173',
  'http://localhost:3000',
]

export function getCorsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get('origin') ?? ''
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]

  return {
    'Access-Control-Allow-Origin':      allowed,
    'Access-Control-Allow-Methods':     'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':     'Content-Type, Authorization, x-app-version',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age':           '86400',
  }
}

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status:  204,
      headers: getCorsHeaders(req),
    })
  }
  return null
}
