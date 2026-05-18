import { createClient }   from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, getCorsHeaders } from '../_shared/cors.ts'
import { requireAuth, errorResponse } from '../_shared/auth.ts'
import { checkRateLimit, RATE_LIMITS } from '../_shared/rateLimiter.ts'
import type { Database }  from '../../../src/types/database.types.ts'

const supabase = createClient<Database>(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

type ExportFormat = 'png' | 'svg' | 'json' | 'pdf' | 'pptx'

interface ExportRequest {
  sceneId:  string
  format:   ExportFormat
  quality?: number      // PNG: 0.1 - 1.0
  scale?:   number      // 1x, 2x, 3x
}

// Pro tələb edən formatlar
const PRO_FORMATS: ExportFormat[] = ['pdf', 'pptx']

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const corsHeaders = getCorsHeaders(req)

  if (req.method !== 'POST') {
    return errorResponse(405, 'METHOD_NOT_ALLOWED', 'POST only', corsHeaders)
  }

  // ── Auth ─────────────────────────────────────────────────────────────────
  const authResult = await requireAuth(req, supabase)
  if (authResult instanceof Response) return authResult
  const { user } = authResult

  // ── Rate limit: saatda 20 export ─────────────────────────────────────────
  const rateResult = await checkRateLimit(supabase, {
    key:         `export:${user.id}`,
    maxRequests: RATE_LIMITS.export.maxRequests,
    windowMs:    RATE_LIMITS.export.windowMs,
  })

  if (!rateResult.allowed) {
    return errorResponse(429, 'RATE_LIMITED', 'Export limit reached. Try again later.', corsHeaders)
  }

  let body: ExportRequest
  try {
    body = await req.json()
  } catch {
    return errorResponse(400, 'INVALID_JSON', 'Invalid request body', corsHeaders)
  }

  const { sceneId, format } = body

  // ── Pro format yoxlaması ──────────────────────────────────────────────────
  if (PRO_FORMATS.includes(format) && user.plan !== 'pro') {
    return errorResponse(
      403,
      'PRO_REQUIRED',
      `${format.toUpperCase()} export requires a Pro subscription`,
      corsHeaders
    )
  }

  // ── Scene məlumatını yüklə ────────────────────────────────────────────────
  const { data: scene, error: sceneError } = await supabase
    .from('scenes')
    .select('id, title, elements, app_state, owner_id, is_public')
    .eq('id', sceneId)
    .single()

  if (sceneError || !scene) {
    return errorResponse(404, 'SCENE_NOT_FOUND', 'Scene not found', corsHeaders)
  }

  // Giriş icazəsi yoxla
  const hasAccess =
    scene.owner_id === user.id ||
    scene.is_public

  if (!hasAccess) {
    const { data: collab } = await supabase
      .from('scene_collaborators')
      .select('id')
      .eq('scene_id', sceneId)
      .eq('user_id', user.id)
      .single()

    if (!collab) {
      return errorResponse(403, 'FORBIDDEN', 'No access to this scene', corsHeaders)
    }
  }

  // ── Format-a görə export ─────────────────────────────────────────────────
  try {
    switch (format) {
      case 'json': {
        const jsonData = JSON.stringify({
          type:     'flaro',
          version:  2,
          source:   'https://flaro.app',
          elements: scene.elements,
          appState: scene.app_state,
        }, null, 2)

        return new Response(jsonData, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type':        'application/json',
            'Content-Disposition': `attachment; filename="${scene.title}.flaro.json"`,
          },
        })
      }

      case 'svg': {
        // SVG generasiyası client-side daha yaxşıdır
        // Bu endpoint metadata qaytarır, client render edir
        return new Response(
          JSON.stringify({
            format:   'svg',
            elements: scene.elements,
            appState: scene.app_state,
            title:    scene.title,
          }),
          {
            status:  200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      case 'pdf':
      case 'pptx': {
        // Bu formatlar üçün external service və ya Puppeteer lazımdır
        // Placeholder — production-da implement et
        return new Response(
          JSON.stringify({
            format,
            message: `${format.toUpperCase()} export processing. Download link will be emailed.`,
            elements: scene.elements,
          }),
          {
            status:  202,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      default:
        return errorResponse(400, 'UNSUPPORTED_FORMAT', `Format '${format}' not supported`, corsHeaders)
    }
  } catch (err) {
    console.error('[Export] Error:', err)
    return errorResponse(500, 'EXPORT_FAILED', 'Export failed', corsHeaders)
  }
})
