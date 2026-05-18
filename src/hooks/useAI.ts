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
