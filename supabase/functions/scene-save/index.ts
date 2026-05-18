import { createClient }    from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, getCorsHeaders } from '../_shared/cors.ts'
import { requireAuth, errorResponse, successResponse } from '../_shared/auth.ts'
import { checkRateLimit }  from '../_shared/rateLimiter.ts'
import type { Database }   from '../../../src/types/database.types.ts'

const supabase = createClient<Database>(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

interface SaveRequest {
  sceneId:   string
  title:     string
  elements:  unknown[]
  appState:  unknown
  thumbnail?: string   // Base64 PNG
}

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

  // ── Rate limit: saatda 300 save ───────────────────────────────────────────
  const rateResult = await checkRateLimit(supabase, {
    key:         `scene-save:${user.id}`,
    maxRequests: 300,
    windowMs:    60 * 60 * 1000,
  })

  if (!rateResult.allowed) {
    return errorResponse(429, 'RATE_LIMITED', 'Too many save requests', corsHeaders)
  }

  // ── Body parse ────────────────────────────────────────────────────────────
  let body: SaveRequest
  try {
    body = await req.json()
  } catch {
    return errorResponse(400, 'INVALID_JSON', 'Invalid request body', corsHeaders)
  }

  const { sceneId, title, elements, appState, thumbnail } = body

  if (!sceneId || typeof sceneId !== 'string') {
    return errorResponse(400, 'INVALID_SCENE_ID', 'sceneId is required', corsHeaders)
  }

  // ── Scene-in sahibini yoxla ───────────────────────────────────────────────
  const { data: existingScene, error: fetchError } = await supabase
    .from('scenes')
    .select('id, owner_id, version')
    .eq('id', sceneId)
    .single()

  if (fetchError || !existingScene) {
    return errorResponse(404, 'SCENE_NOT_FOUND', 'Scene not found', corsHeaders)
  }

  // Sahibi deyilsə yoxla — collaborator edit icazəsi?
  if (existingScene.owner_id !== user.id) {
    const { data: collab } = await supabase
      .from('scene_collaborators')
      .select('permission')
      .eq('scene_id', sceneId)
      .eq('user_id', user.id)
      .single()

    if (!collab || collab.permission !== 'edit') {
      return errorResponse(403, 'FORBIDDEN', 'No edit permission', corsHeaders)
    }
  }

  const newVersion = (existingScene.version ?? 1) + 1

  // ── Scene yenilə ─────────────────────────────────────────────────────────
  const { data: updatedScene, error: updateError } = await supabase
    .from('scenes')
    .update({
      title:         title?.slice(0, 100) ?? existingScene.id,
      elements:      elements as any,
      app_state:     appState as any,
      version:       newVersion,
      last_edited_by: user.id,
    })
    .eq('id', sceneId)
    .select('id, version, updated_at')
    .single()

  if (updateError) {
    console.error('[SceneSave] Update error:', updateError)
    return errorResponse(500, 'SAVE_FAILED', 'Failed to save scene', corsHeaders)
  }

  // ── Thumbnail saxla (Pro) ─────────────────────────────────────────────────
  if (thumbnail && user.plan === 'pro') {
    try {
      const base64Data  = thumbnail.replace(/^data:image\/\w+;base64,/, '')
      const binaryData  = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))

      const thumbPath = `${user.id}/${sceneId}.png`

      await supabase.storage
        .from('thumbnails')
        .upload(thumbPath, binaryData, {
          contentType: 'image/png',
          upsert:      true,
        })

      const { data: { publicUrl } } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(thumbPath)

      await supabase
        .from('scenes')
        .update({ thumbnail_url: publicUrl })
        .eq('id', sceneId)

    } catch (thumbErr) {
      console.error('[SceneSave] Thumbnail error:', thumbErr)
      // Thumbnail xətası save-i dayandırmasın
    }
  }

  // ── Versiya tarixini saxla (Pro) ──────────────────────────────────────────
  if (user.plan === 'pro' && newVersion % 5 === 0) {
    // Hər 5 save-də bir versiya snapshot
    await supabase.from('scene_versions').insert({
      scene_id:  sceneId,
      version:   newVersion,
      elements:  elements as any,
      app_state: appState as any,
      saved_by:  user.id,
    }).then(({ error }) => {
      if (error) console.error('[SceneSave] Version snapshot error:', error)
    })
  }

  return successResponse(
    { id: updatedScene.id, version: updatedScene.version, savedAt: updatedScene.updated_at },
    200,
    corsHeaders
  )
})
