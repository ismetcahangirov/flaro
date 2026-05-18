import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RateLimitConfig {
  key:         string   // Unikal identifikator (IP, userId)
  maxRequests: number   // Maksimum sorğu sayı
  windowMs:    number   // Zaman pəncərəsi (millisaniyə)
}

interface RateLimitResult {
  allowed:    boolean
  remaining:  number
  resetAt:    Date
}

// Supabase-i key-value store kimi istifadə et
export async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now      = Date.now()
  const windowMs = config.windowMs
  const resetAt  = new Date(now + windowMs)

  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_key:          config.key,
    p_max_requests: config.maxRequests,
    p_window_ms:    windowMs,
  })

  if (error) {
    // Rate limit xətası olsa belə sorğuya icazə ver (fail open)
    console.error('[RateLimit] Error:', error)
    return { allowed: true, remaining: config.maxRequests, resetAt }
  }

  return {
    allowed:   data.allowed,
    remaining: data.remaining,
    resetAt,
  }
}

// Rate limit limitləri
export const RATE_LIMITS = {
  auth:     { maxRequests: 5,   windowMs: 15 * 60 * 1000 }, // 5/15dəq
  api:      { maxRequests: 100, windowMs: 60 * 1000 },       // 100/dəq
  ai:       { maxRequests: 10,  windowMs: 24 * 60 * 60 * 1000 }, // 10/gün (free)
  export:   { maxRequests: 20,  windowMs: 60 * 60 * 1000 },  // 20/saat
} as const
