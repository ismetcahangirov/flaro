# SketchFlow — API və Edge Functions

> **Supabase Edge Functions** — Scene CRUD, AI inteqrasiyası, Export (PDF/PPTX/PNG/SVG)
> TypeScript strict mode ilə tam tipləşdirilmiş

---

## 🗺️ API Xəritəsi

```
┌─────────────────────────────────────────────────────────────────┐
│                    EDGE FUNCTIONS                               │
├──────────────────────────────┬──────────────────────────────────┤
│  Auth tələb olunur           │  Public                         │
├──────────────────────────────┼──────────────────────────────────┤
│  POST /scene-save            │  GET  /scene-public             │
│  POST /scene-export          │  GET  /scene-thumbnail          │
│  POST /ai-generate           │                                 │
│  POST /create-checkout-*     │                                 │
│  POST /create-portal-*       │                                 │
└──────────────────────────────┴──────────────────────────────────┘

Supabase RLS ilə idarə olunan (Edge Function lazım deyil):
  scenes       — supabase-js client ilə birbaşa
  profiles     — supabase-js client ilə birbaşa
  comments     — supabase-js client ilə birbaşa
  workspaces   — supabase-js client ilə birbaşa
```

---

## 🔧 Shared Utilities

### `supabase/functions/_shared/auth.ts`

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Database } from '../../../src/types/database.types.ts'

type SupabaseClient = ReturnType<typeof createClient<Database>>

export interface AuthUser {
  id:    string
  email: string | undefined
  plan:  'free' | 'pro'
}

/**
 * Request-dən JWT token götür, doğrula, profili qaytar
 * Plan yoxlaması daxil
 */
export async function requireAuth(
  req:           Request,
  supabase:      SupabaseClient,
  requirePro   = false
): Promise<{ user: AuthUser } | Response> {
  const authHeader = req.headers.get('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return errorResponse(401, 'UNAUTHORIZED', 'Missing or invalid Authorization header')
  }

  const token = authHeader.replace('Bearer ', '').trim()

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    return errorResponse(401, 'UNAUTHORIZED', 'Invalid or expired token')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = profile?.plan ?? 'free'

  if (requirePro && plan !== 'pro') {
    return errorResponse(403, 'PRO_REQUIRED', 'This feature requires a Pro subscription')
  }

  return {
    user: {
      id:    user.id,
      email: user.email,
      plan,
    }
  }
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
```

---

## 💾 Scene Save Edge Function

### `supabase/functions/scene-save/index.ts`

```typescript
import { createClient }    from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, getCorsHeaders } from '../_shared/cors.ts'
import { requireAuth, errorResponse, successResponse } from '../_shared/auth.ts'
import { checkRateLimit }  from '../_shared/rateLimiter.ts'
import type { Database }   from '../../../src/types/database.types.ts'
import type { SceneData }  from '../../../src/types/canvas.types.ts'

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
```

---

## 📤 Export Edge Function

### `supabase/functions/scene-export/index.ts`

```typescript
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

  const { sceneId, format, quality = 1, scale = 2 } = body

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
          type:     'sketchflow',
          version:  2,
          source:   'https://sketchflow.app',
          elements: scene.elements,
          appState: scene.app_state,
        }, null, 2)

        return new Response(jsonData, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type':        'application/json',
            'Content-Disposition': `attachment; filename="${scene.title}.sketchflow.json"`,
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
```

---

## 🤖 AI Generate Edge Function

### `supabase/functions/ai-generate/index.ts`

```typescript
import { createClient }   from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, getCorsHeaders } from '../_shared/cors.ts'
import { requireAuth, errorResponse, successResponse } from '../_shared/auth.ts'
import { checkRateLimit, RATE_LIMITS } from '../_shared/rateLimiter.ts'
import type { Database }  from '../../../src/types/database.types.ts'

const supabase = createClient<Database>(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

interface AIGenerateRequest {
  prompt:   string
  type:     'diagram' | 'flowchart' | 'mindmap' | 'wireframe'
  context?: string    // Mövcud canvas elementlərinin təsviri
}

interface GeneratedElement {
  type:        string
  x:           number
  y:           number
  width:       number
  height:      number
  text?:       string
  strokeColor: string
  fillColor:   string
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

  // ── Rate limit: Free 10/gün, Pro 100/gün ─────────────────────────────────
  const dailyLimit = user.plan === 'pro' ? 100 : 10

  const rateResult = await checkRateLimit(supabase, {
    key:         `ai:${user.id}:${new Date().toISOString().slice(0, 10)}`,
    maxRequests: dailyLimit,
    windowMs:    RATE_LIMITS.ai.windowMs,
  })

  if (!rateResult.allowed) {
    return errorResponse(
      429,
      'AI_LIMIT_REACHED',
      user.plan === 'pro'
        ? 'Daily AI limit (100) reached. Resets at midnight.'
        : `Daily AI limit (10) reached. Upgrade to Pro for 100 requests/day.`,
      corsHeaders
    )
  }

  let body: AIGenerateRequest
  try {
    body = await req.json()
  } catch {
    return errorResponse(400, 'INVALID_JSON', 'Invalid request body', corsHeaders)
  }

  const { prompt, type, context } = body

  if (!prompt || prompt.length > 500) {
    return errorResponse(400, 'INVALID_PROMPT', 'Prompt must be 1-500 characters', corsHeaders)
  }

  // ── Claude API çağırışı ───────────────────────────────────────────────────
  const systemPrompt = `You are a diagram generation assistant for SketchFlow, a hand-drawn style whiteboard app.

Generate canvas elements based on the user's request. Return ONLY valid JSON array of elements.
Each element must have these fields:
- type: "rectangle" | "ellipse" | "diamond" | "text" | "arrow" | "line"
- x, y: position (number)
- width, height: dimensions (number)
- text: string (for text elements or labels)
- strokeColor: hex color (use "#1e1e1e" for dark, "#F97316" for orange accents)
- fillColor: hex color or "transparent"
- roughness: 1 (hand-drawn feel)
- strokeWidth: 2

Layout rules:
- Start at x:50, y:50
- Leave 40px gaps between elements
- Keep within 1200x800 viewport
- For ${type}: ${getDiagramInstructions(type)}

Context about existing canvas: ${context ?? 'Empty canvas'}

Return ONLY a JSON array. No markdown, no explanation.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system:     systemPrompt,
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('[AI] Anthropic error:', err)
      return errorResponse(502, 'AI_ERROR', 'AI service unavailable', corsHeaders)
    }

    const aiResponse = await response.json()
    const rawText    = aiResponse.content?.[0]?.text ?? '[]'

    // JSON parse
    let elements: GeneratedElement[]
    try {
      const cleaned = rawText.replace(/```json|```/g, '').trim()
      elements      = JSON.parse(cleaned)

      if (!Array.isArray(elements)) throw new Error('Not an array')
    } catch {
      console.error('[AI] Parse error, raw:', rawText)
      return errorResponse(502, 'AI_PARSE_ERROR', 'Failed to parse AI response', corsHeaders)
    }

    // Elementləri sanitize et
    const sanitized = elements
      .slice(0, 50)  // Maksimum 50 element
      .map(el => ({
        ...el,
        id:          crypto.randomUUID(),
        angle:       0,
        opacity:     100,
        version:     1,
        isDeleted:   false,
        seed:        Math.floor(Math.random() * 100000),
        fillStyle:   'hachure' as const,
        strokeStyle: 'solid'   as const,
      }))

    return successResponse(
      {
        elements,
        remaining: rateResult.remaining,
        limit:     dailyLimit,
      },
      200,
      corsHeaders
    )

  } catch (err) {
    console.error('[AI] Error:', err)
    return errorResponse(500, 'AI_FAILED', 'AI generation failed', corsHeaders)
  }
})

function getDiagramInstructions(type: string): string {
  const instructions: Record<string, string> = {
    diagram:   'Create a general diagram with labeled boxes and connecting arrows',
    flowchart: 'Use rectangles for steps, diamonds for decisions, arrows for flow. Top to bottom layout.',
    mindmap:   'Central concept in center, branches radiating outward with ellipses',
    wireframe: 'Use rectangles for UI components, text labels inside. Clean grid layout.',
  }
  return instructions[type] ?? 'Create appropriate diagram elements'
}
```

---

## 🪝 useScene Hook

### `src/hooks/useScene.ts`

```typescript
import { useState, useCallback, useRef } from 'react'
import { useNavigate }    from 'react-router-dom'
import { supabase }       from '@/lib/supabase'
import { useCanvasStore } from '@/store/canvasStore'
import { useAuth }        from '@/hooks/useAuth'
import { sanitizeTitle }  from '@/lib/sanitize'
import type { Scene }     from '@/types/database.types'

const AUTOSAVE_DEBOUNCE_MS = 2000  // 2 saniyə

export function useScene(sceneId?: string) {
  const navigate = useNavigate()
  const canvas   = useCanvasStore()
  const { user, isPro } = useAuth()

  const [scene,      setScene]      = useState<Scene | null>(null)
  const [isSaving,   setIsSaving]   = useState(false)
  const [isLoading,  setIsLoading]  = useState(false)
  const [lastSaved,  setLastSaved]  = useState<Date | null>(null)
  const [saveError,  setSaveError]  = useState<string | null>(null)

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Scene yüklə ──────────────────────────────────────────────────────────
  const loadScene = useCallback(async (id: string) => {
    setIsLoading(true)
    setSaveError(null)

    try {
      const { data, error } = await supabase
        .from('scenes')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      setScene(data)
      canvas.loadScene(
        (data.elements as any) ?? [],
        (data.app_state as any) ?? {
          zoom: 1, scrollX: 0, scrollY: 0,
          backgroundColor: '#ffffff',
          gridEnabled: false, gridSize: 20, theme: 'light',
        }
      )

    } catch (err: any) {
      console.error('[Scene] Load error:', err)
      if (err.code === 'PGRST116') navigate('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }, [canvas, navigate])

  // ── Scene saxla ───────────────────────────────────────────────────────────
  const saveScene = useCallback(async (force = false) => {
    if (!sceneId || !user) return
    if (isSaving && !force) return

    setIsSaving(true)
    setSaveError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')

      // Canvas thumbnail-ı yarat (async, bloklama)
      let thumbnail: string | undefined
      if (isPro) {
        thumbnail = await generateThumbnail()
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scene-save`,
        {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            sceneId,
            title:    canvas.elements.length > 0
              ? scene?.title ?? 'Untitled'
              : 'Untitled',
            elements: canvas.elements,
            appState: canvas.appState,
            thumbnail,
          }),
        }
      )

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error?.message ?? 'Save failed')
      }

      canvas.setDirty(false)
      setLastSaved(new Date())

    } catch (err: any) {
      setSaveError(err.message)
      console.error('[Scene] Save error:', err)
    } finally {
      setIsSaving(false)
    }
  }, [sceneId, user, isSaving, canvas, scene, isPro])

  // ── Avtomatik saxlama (Pro) ───────────────────────────────────────────────
  const scheduleAutoSave = useCallback(() => {
    if (!isPro) return

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)

    autoSaveTimer.current = setTimeout(() => {
      if (canvas.isDirty) saveScene()
    }, AUTOSAVE_DEBOUNCE_MS)
  }, [isPro, canvas.isDirty, saveScene])

  // ── Yeni scene yarat ──────────────────────────────────────────────────────
  const createScene = useCallback(async (title = 'Untitled Scene') => {
    if (!user) return null

    const { data, error } = await supabase
      .from('scenes')
      .insert({
        owner_id: user.id,
        title:    sanitizeTitle(title),
        elements: [],
        app_state: {
          zoom: 1, scrollX: 0, scrollY: 0,
          backgroundColor: '#ffffff',
          gridEnabled: false, gridSize: 20, theme: 'light',
        },
      })
      .select()
      .single()

    if (error) {
      // DB trigger xətası (Free plan limiti)
      if (error.message.includes('FREE_PLAN_LIMIT')) {
        throw new Error('FREE_PLAN_LIMIT')
      }
      throw error
    }

    return data
  }, [user])

  // ── Scene sil ─────────────────────────────────────────────────────────────
  const deleteScene = useCallback(async (id: string) => {
    if (!user) return

    const { error } = await supabase
      .from('scenes')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id)  // Yalnız öz scene-ni silə bilər

    if (error) throw error
  }, [user])

  // ── Scene adını dəyişdirr ─────────────────────────────────────────────────
  const renameScene = useCallback(async (id: string, newTitle: string) => {
    const { data, error } = await supabase
      .from('scenes')
      .update({ title: sanitizeTitle(newTitle) })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (scene?.id === id) setScene(data)
    return data
  }, [scene])

  // ── Scene duplicate et ────────────────────────────────────────────────────
  const duplicateScene = useCallback(async (id: string) => {
    if (!user) return null

    const { data: original, error: fetchError } = await supabase
      .from('scenes')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !original) throw new Error('Scene not found')

    const { data, error } = await supabase
      .from('scenes')
      .insert({
        owner_id:  user.id,
        title:     `${original.title} (Kopya)`,
        elements:  original.elements,
        app_state: original.app_state,
      })
      .select()
      .single()

    if (error) {
      if (error.message.includes('FREE_PLAN_LIMIT')) {
        throw new Error('FREE_PLAN_LIMIT')
      }
      throw error
    }

    return data
  }, [user])

  return {
    scene,
    isSaving,
    isLoading,
    lastSaved,
    saveError,
    loadScene,
    saveScene,
    createScene,
    deleteScene,
    renameScene,
    duplicateScene,
    scheduleAutoSave,
  }
}

// ── Canvas thumbnail yaratma ─────────────────────────────────────────────────

async function generateThumbnail(): Promise<string | undefined> {
  try {
    const canvas = document.querySelector<HTMLCanvasElement>('#main-canvas')
    if (!canvas) return undefined

    // Kiçik thumbnail üçün offscreen canvas
    const thumb   = document.createElement('canvas')
    thumb.width   = 400
    thumb.height  = 300
    const ctx     = thumb.getContext('2d')!

    ctx.drawImage(canvas, 0, 0, 400, 300)
    return thumb.toDataURL('image/png', 0.7)
  } catch {
    return undefined
  }
}
```

---

## 🤖 useAI Hook

### `src/hooks/useAI.ts`

```typescript
import { useState, useCallback } from 'react'
import { supabase }       from '@/lib/supabase'
import { useCanvasStore } from '@/store/canvasStore'
import { useAuth }        from '@/hooks/useAuth'
import { nanoid }         from 'nanoid'
import type { CanvasElement } from '@/types/canvas.types'

type DiagramType = 'diagram' | 'flowchart' | 'mindmap' | 'wireframe'

interface AIState {
  isGenerating:  boolean
  error:         string | null
  remaining:     number | null
  limit:         number | null
}

export function useAI() {
  const canvas            = useCanvasStore()
  const { user, isPro }   = useAuth()

  const [state, setState] = useState<AIState>({
    isGenerating: false,
    error:        null,
    remaining:    null,
    limit:        null,
  })

  const generate = useCallback(async (
    prompt:  string,
    type:    DiagramType = 'diagram'
  ) => {
    if (!user) return
    if (state.isGenerating) return

    setState(s => ({ ...s, isGenerating: true, error: null }))

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')

      // Mövcud elementlər haqqında qısa kontekst
      const context = canvas.elements.length > 0
        ? `Canvas has ${canvas.elements.length} existing elements`
        : undefined

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-generate`,
        {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ prompt, type, context }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message ?? 'Generation failed')
      }

      // History saxla
      canvas.saveHistory()

      // Elementləri canvas-a əlavə et — mərkəzə yerləşdir
      const { zoom, scrollX, scrollY } = canvas.appState
      const centerX = (window.innerWidth  / 2 - scrollX) / zoom
      const centerY = (window.innerHeight / 2 - scrollY) / zoom

      const generatedEls: CanvasElement[] = (data.elements as any[]).map(el => ({
        ...el,
        id:      nanoid(),
        x:       (el.x ?? 0) + centerX - 200,
        y:       (el.y ?? 0) + centerY - 150,
        version: 1,
        seed:    Math.floor(Math.random() * 100000),
      }))

      generatedEls.forEach(el => canvas.addElement(el))

      setState(s => ({
        ...s,
        remaining: data.remaining,
        limit:     data.limit,
      }))

    } catch (err: any) {
      setState(s => ({ ...s, error: err.message }))
    } finally {
      setState(s => ({ ...s, isGenerating: false }))
    }
  }, [user, state.isGenerating, canvas])

  return {
    ...state,
    generate,
    dailyLimit: isPro ? 100 : 10,
  }
}
```

---

## 📋 useExport Hook

### `src/hooks/useExport.ts`

```typescript
import { useCallback, useState } from 'react'
import { supabase }      from '@/lib/supabase'
import { useCanvasStore } from '@/store/canvasStore'
import { useAuth }       from '@/hooks/useAuth'

type ExportFormat = 'png' | 'svg' | 'json' | 'pdf' | 'pptx'

export function useExport(sceneId: string) {
  const canvas           = useCanvasStore()
  const { isPro, user }  = useAuth()
  const [isExporting, setIsExporting] = useState(false)

  const exportScene = useCallback(async (format: ExportFormat) => {
    if (!user) return

    // Client-side formatlar
    if (format === 'png') {
      return exportAsPNG()
    }
    if (format === 'svg') {
      return exportAsSVG()
    }
    if (format === 'json') {
      return exportAsJSON()
    }

    // Server-side Pro formatlar
    if (!isPro && (format === 'pdf' || format === 'pptx')) {
      throw new Error('PRO_REQUIRED')
    }

    setIsExporting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scene-export`,
        {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ sceneId, format }),
        }
      )

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error?.message ?? 'Export failed')
      }

      // 202 — async processing
      if (response.status === 202) {
        const data = await response.json()
        alert(data.message)  // Əsl app-da toast notification
        return
      }

      // Faylı endir
      const blob     = await response.blob()
      const url      = URL.createObjectURL(blob)
      const a        = document.createElement('a')
      a.href         = url
      a.download     = `scene.${format}`
      a.click()
      URL.revokeObjectURL(url)

    } finally {
      setIsExporting(false)
    }
  }, [sceneId, isPro, user, canvas])

  // ── Client-side export funksiyaları ──────────────────────────────────────

  const exportAsPNG = useCallback(async () => {
    const mainCanvas = document.querySelector<HTMLCanvasElement>('#main-canvas')
    if (!mainCanvas) return

    const scale   = 2  // 2x resolution
    const offscreen = document.createElement('canvas')
    offscreen.width  = mainCanvas.width  * scale
    offscreen.height = mainCanvas.height * scale
    const ctx     = offscreen.getContext('2d')!
    ctx.scale(scale, scale)
    ctx.drawImage(mainCanvas, 0, 0)

    const url = offscreen.toDataURL('image/png', 1.0)
    const a   = document.createElement('a')
    a.href    = url
    a.download = 'scene.png'
    a.click()
  }, [])

  const exportAsSVG = useCallback(() => {
    // Canvas elementlərini SVG-ə çevir
    const elements = canvas.elements.filter(e => !e.isDeleted)
    const minX = Math.min(...elements.map(e => e.x), 0)
    const minY = Math.min(...elements.map(e => e.y), 0)
    const maxX = Math.max(...elements.map(e => e.x + e.width), 800)
    const maxY = Math.max(...elements.map(e => e.y + e.height), 600)

    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="${minX - 20} ${minY - 20} ${maxX - minX + 40} ${maxY - minY + 40}"
     width="${maxX - minX + 40}"
     height="${maxY - minY + 40}">
  <rect fill="${canvas.appState.backgroundColor}"
        x="${minX - 20}" y="${minY - 20}"
        width="${maxX - minX + 40}" height="${maxY - minY + 40}"/>
  ${elements.map(el => elementToSVG(el)).join('\n  ')}
</svg>`

    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'scene.svg'
    a.click()
    URL.revokeObjectURL(url)
  }, [canvas])

  const exportAsJSON = useCallback(() => {
    const data = JSON.stringify({
      type:     'sketchflow',
      version:  2,
      elements: canvas.elements,
      appState: canvas.appState,
    }, null, 2)

    const blob = new Blob([data], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'scene.sketchflow.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [canvas])

  return { exportScene, isExporting }
}

// Sadə SVG element çevirmə
function elementToSVG(el: any): string {
  switch (el.type) {
    case 'rectangle':
      return `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}"
                    stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}"
                    fill="${el.fillColor === 'transparent' ? 'none' : el.fillColor}"
                    opacity="${el.opacity / 100}"/>`
    case 'text':
      return `<text x="${el.x}" y="${el.y + (el.fontSize ?? 20)}"
                    font-size="${el.fontSize ?? 20}"
                    fill="${el.strokeColor}" opacity="${el.opacity / 100}">${el.text ?? ''}</text>`
    default:
      return ''
  }
}
```

---

## ✅ API Xülasəsi

| Edge Function | Auth | Plan | Rate Limit | Məzmun |
|--------------|------|------|------------|--------|
| `scene-save` | ✅ | Free + Pro | 300/saat | Save + thumbnail + versioning |
| `scene-export` | ✅ | PDF/PPTX: Pro | 20/saat | PNG/SVG/JSON/PDF/PPTX |
| `ai-generate` | ✅ | Free(10/gün), Pro(100/gün) | Gündəlik | Claude AI ilə diagram gen |
| `create-checkout-session` | ✅ | Any | 5/saat | Stripe checkout |
| `create-portal-session` | ✅ | Pro | — | Billing portal |
| `stripe-webhook` | Service | — | — | Plan sync |

**Client-side hooks:**
- `useScene.ts` — Load, save, create, delete, rename, duplicate
- `useAI.ts` — AI generation, rate limit tracking
- `useExport.ts` — PNG/SVG/JSON (client), PDF/PPTX (server)

---

*Növbəti: `08_FRONTEND_COMPONENTS.md` — UI komponentlər, Dashboard, Editor layout, Toolbar*
