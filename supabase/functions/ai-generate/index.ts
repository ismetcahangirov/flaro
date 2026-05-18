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
  const systemPrompt = `You are a diagram generation assistant for Flaro, a hand-drawn style whiteboard app.

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
        model:      'claude-3-5-sonnet-20240620',
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
        elements: sanitized,
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
