import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from './cors.ts'
import type { Database } from '../../../src/types/database.types.ts'

type SupabaseClient = ReturnType<typeof createClient<Database>>

export interface AuthUser {
  id:    string
  email: string | undefined
  plan:  'free' | 'pro'
}

export function errorResponse(
  status:  number,
  code:    string,
  message: string,
  headers: HeadersInit = {}
): Response {
  return new Response(
    JSON.stringify({ error: { code, message } }),
    {
      status,
      headers: { 'Content-Type': 'application/json', ...headers },
    }
  )
}

export function successResponse(
  data:    unknown,
  status = 200,
  headers: HeadersInit = {}
): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: { 'Content-Type': 'application/json', ...headers },
    }
  )
}

export async function requireAuth(
  req:           Request,
  supabase:      SupabaseClient,
  requirePro   = false
): Promise<{ user: AuthUser } | Response> {
  const authHeader = req.headers.get('Authorization')
  const corsHeaders = getCorsHeaders(req)

  if (!authHeader?.startsWith('Bearer ')) {
    return errorResponse(401, 'UNAUTHORIZED', 'Missing or invalid Authorization header', corsHeaders)
  }

  const token = authHeader.replace('Bearer ', '').trim()

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    return errorResponse(401, 'UNAUTHORIZED', 'Invalid or expired token', corsHeaders)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = profile?.plan ?? 'free'

  if (requirePro && plan !== 'pro') {
    return errorResponse(403, 'PRO_REQUIRED', 'This feature requires a Pro subscription', corsHeaders)
  }

  return {
    user: {
      id:    user.id,
      email: user.email,
      plan,
    }
  }
}
