import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate }    from 'react-router-dom'
import { supabase }       from '@/lib/supabase'
import { useCanvasStore } from '@/store/canvasStore'
import { useAuth }        from '@/hooks/useAuth'
import { useAuthStore }   from '@/store/authStore'
import { sanitizeTitle }  from '@/lib/sanitize'
import type { Scene }     from '@/types/database.types'

const AUTOSAVE_DEBOUNCE = 800   // 800ms

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

  // Stable refs — saveScene heç dəyişməsin deyə state yerinə ref istifadə edirik
  const sceneIdRef = useRef(sceneId)
  sceneIdRef.current = sceneId

  const userRef = useRef(user)
  userRef.current = user

  const sceneTitleRef = useRef<string | undefined>(undefined)

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
      sceneTitleRef.current = data.title

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

  // scene dəyişdikdə title ref-i güncəllə
  useEffect(() => {
    if (scene) sceneTitleRef.current = scene.title
  }, [scene])

  // ── Scene saxla ───────────────────────────────────────────────────────────
  // STABLE funksiya — heç bir React state dependency yoxdur, hamısı ref ilə oxunur
  const saveScene = useCallback(async (force = false) => {
    const currentSceneId = sceneIdRef.current
    const currentUser    = userRef.current

    if (!currentSceneId || !currentUser) return
    if (isSavingRef.current && !force) return

    isSavingRef.current = true
    setIsSaving(true)
    setSaveError(null)

      try {
        const { elements, appState } = useCanvasStore.getState()
        const currentSession = useAuthStore.getState().session
        const token = currentSession?.access_token
        
        if (!token) throw new Error('No valid session token available for saving')
        const apikey = import.meta.env.VITE_SUPABASE_ANON_KEY
        const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/scenes?id=eq.${currentSceneId}`
        
        const abortController = new AbortController()
        const timeoutId = setTimeout(() => abortController.abort(), 15000)

        try {
          const response = await fetch(url, {
            method: 'PATCH',
            headers: {
              'apikey': apikey,
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              elements,
              app_state: appState,
              title: sceneTitleRef.current ?? 'Untitled'
            }),
            signal: abortController.signal
          })

          if (!response.ok) {
            throw new Error(`Direct save failed: ${response.statusText}`)
          }
        } finally {
          clearTimeout(timeoutId)
        }

        useCanvasStore.getState().setDirty(false)
        setLastSaved(new Date())

    } catch (err: any) {
      setSaveError(err.message)
    } finally {
      isSavingRef.current = false
      setIsSaving(false)
    }
  }, []) // ← Heç bir dependency yoxdur — tam stable

  // ── Avtomatik saxlama ───────────────────────────────────────────────────
  // STABLE funksiya — saveScene artıq dəyişmir
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)

    autoSaveTimer.current = setTimeout(() => {
      const { isDirty } = useCanvasStore.getState()
      if (isDirty) saveScene()
    }, AUTOSAVE_DEBOUNCE)
  }, [saveScene])

  // ── Tab keçidlərini idarə et ─────────────────────────────────────────────
  // KRİTİK: background-da Supabase auth timeout olur!
  // Həll: arxa planda save etmə, yalnız foreground-a qayıdanda save et.
  useEffect(() => {
    const cancelTimer = () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current)
        autoSaveTimer.current = null
      }
    }

    const handleHide = () => {
      // Arxa plana keçdikdə SAVE ETMƏ — Supabase auth background-da timeout olur!
      // Sadəcə pending timeri ləğv et. Focus qayıdanda save edəcəyik.
      cancelTimer()
    }

    const handleShow = () => {
      // Ön plana qayıdanda: stuck state sıfırla, sonra save et
      isSavingRef.current = false
      setIsSaving(false)
      const { isDirty } = useCanvasStore.getState()
      if (isDirty) {
        // 200ms gözlə ki browser/Supabase auth session stabil olsun
        setTimeout(() => saveScene(), 200)
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') handleHide()
      else handleShow()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur',  handleHide)
    window.addEventListener('focus', handleShow)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur',  handleHide)
      window.removeEventListener('focus', handleShow)
    }
  }, [saveScene])

  // ── Timer cleanup effect ────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [])

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
    if (scene?.id === id) {
      setScene(data)
      sceneTitleRef.current = data.title
    }
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
