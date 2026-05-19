import { useState, useCallback, useRef } from 'react'
import { useNavigate }    from 'react-router-dom'
import { supabase }       from '@/lib/supabase'
import { useCanvasStore } from '@/store/canvasStore'
import { useAuth }        from '@/hooks/useAuth'
import { sanitizeTitle }  from '@/lib/sanitize'
import type { Scene }     from '@/types/database.types'

const AUTOSAVE_DEBOUNCE_PRO  = 1_000   // 1s
const AUTOSAVE_DEBOUNCE_FREE = 1_000   // 1s

export function useScene(sceneId?: string) {
  const navigate = useNavigate()
  // Read canvas state imperatively via getState() to avoid stale closure issues
  const { user } = useAuth()

  const [scene,      setScene]      = useState<Scene | null>(null)
  const [isSaving,   setIsSaving]   = useState(false)
  const [isLoading,  setIsLoading]  = useState(false)
  const [lastSaved,  setLastSaved]  = useState<Date | null>(null)
  const [saveError,  setSaveError]  = useState<string | null>(null)

  const autoSaveTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSavingRef    = useRef(false)

  // ── Scene yüklə ──────────────────────────────────────────────────────────
  const loadScene = useCallback(async (id: string) => {
    setIsLoading(true)
    setSaveError(null)

    try {
      const { data, error } = await (supabase
        .from('scenes')
        .select('*')
        .eq('id', id)
        .single() as any)

      if (error) throw error

      setScene(data)

      // Use getState() to avoid stale canvas reference in closure
      useCanvasStore.getState().loadScene(
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
  }, [navigate]) // canvas dependency removed — using getState() instead

  // ── Scene saxla ───────────────────────────────────────────────────────────
  const saveScene = useCallback(async (force = false) => {
    if (!sceneId || !user) return
    if (isSavingRef.current && !force) return

    isSavingRef.current = true
    setIsSaving(true)
    setSaveError(null)

    try {
      // Read current canvas state imperatively (no stale closure)
      const { elements, appState } = useCanvasStore.getState()

      const { error } = await (supabase
        .from('scenes') as any)
        .update({
          elements,
          app_state: appState,
          title: scene?.title ?? 'Untitled',
        })
        .eq('id', sceneId)

      if (error) throw error

      useCanvasStore.getState().setDirty(false)
      setLastSaved(new Date())

    } catch (err: any) {
      setSaveError(err.message)
      console.error('[Scene] Save error:', err)
    } finally {
      isSavingRef.current = false
      setIsSaving(false)
    }
  }, [sceneId, user, scene])

  // ── Avtomatik saxlama ───────────────────────────────────────────────────
  // Stable reference — uses refs to avoid recreating on every render
  const scheduleAutoSave = useCallback(() => {
    const delay = AUTOSAVE_DEBOUNCE_PRO

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)

    autoSaveTimer.current = setTimeout(() => {
      const { isDirty } = useCanvasStore.getState()
      if (isDirty) saveScene()
    }, delay)
  }, [saveScene]) // canvas.isDirty removed — reads via getState()

  // ── Yeni scene yarat ──────────────────────────────────────────────────────
  const createScene = useCallback(async (title = 'Untitled Scene') => {
    if (!user) return null

    const { data, error } = await ((supabase
      .from('scenes') as any)
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
      .single())

    if (error) {
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

    const { error } = await (supabase
      .from('scenes')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id) as any)

    if (error) throw error
  }, [user])

  // ── Scene adını dəyişdir ──────────────────────────────────────────────────
  const renameScene = useCallback(async (id: string, newTitle: string) => {
    const { data, error } = await ((supabase
      .from('scenes') as any)
      .update({ title: sanitizeTitle(newTitle) })
      .eq('id', id)
      .select()
      .single())

    if (error) throw error
    if (scene?.id === id) setScene(data)
    return data
  }, [scene])

  // ── Scene duplicate et ────────────────────────────────────────────────────
  const duplicateScene = useCallback(async (id: string) => {
    if (!user) return null

    const { data: original, error: fetchError } = await (supabase
      .from('scenes')
      .select('*')
      .eq('id', id)
      .single() as any)

    if (fetchError || !original) throw new Error('Scene not found')

    const { data, error } = await ((supabase
      .from('scenes') as any)
      .insert({
        owner_id:  user.id,
        title:     `${original.title} (Kopya)`,
        elements:  original.elements,
        app_state: original.app_state,
      })
      .select()
      .single())

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