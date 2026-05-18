import { useEffect, useRef, useCallback } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase }        from '@/lib/supabase'
import { useCanvasStore }  from '@/store/canvasStore'
import { useCollabStore }  from '@/store/collabStore'
import { useAuth }         from '@/hooks/useAuth'
import { getUserColor }    from '@/lib/collabColors'
import type {
  CollabEvent,
  CollabUser,
} from '@/types/collaboration.types'
import type { Point, CanvasElement } from '@/types/canvas.types'

// Cursor throttle — 50ms-dən bir göndər
const CURSOR_THROTTLE_MS = 50
// Element sync debounce — 300ms
const SYNC_DEBOUNCE_MS   = 300

export function useCollaboration(sceneId: string) {
  const { user, profile, isPro } = useAuth()
  const canvas  = useCanvasStore()
  const collab  = useCollabStore()

  const channelRef      = useRef<RealtimeChannel | null>(null)
  const lastCursorSend  = useRef<number>(0)
  const syncDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Gələn event-i işlə ──────────────────────────────────────────────────────
  const handleIncomingEvent = useCallback((event: CollabEvent) => {
    const { payload } = event

    switch (payload.type) {
      case 'element_add':
        if (!canvas.elements.find(e => e.id === payload.element.id)) {
          canvas.addElement(payload.element)
        }
        break

      case 'element_update': {
        const local = canvas.elements.find(e => e.id === payload.id)
        if (!local || payload.version >= (local.version ?? 0)) {
          canvas.updateElement(payload.id, {
            ...payload.updates,
            version: payload.version,
          })
        }
        break
      }

      case 'element_delete':
        canvas.deleteElements(payload.ids)
        break

      case 'elements_batch':
        canvas.setElements(payload.elements)
        break

      case 'scene_clear':
        canvas.clearCanvas()
        break

      case 'user_selection':
        collab.updateSelection(event.userId, payload.selectedIds)
        break
    }
  }, [canvas, collab])

  // ── Kanalı qur ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !sceneId) return

    collab.setConnecting(true)

    const channel = supabase.channel(`scene:${sceneId}`, {
      config: {
        presence:  { key: user.id },
        broadcast: { self: false },
      },
    })

    // ── Presence: online istifadəçilər ────────────────────────────────────
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<CollabUser>()

      Object.entries(state).forEach(([userId, presences]) => {
        if (userId === user.id) return
        const latest = presences[presences.length - 1] as unknown as CollabUser
        if (latest) collab.upsertUser(latest)
      })
    })

    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      const presence = newPresences[0] as unknown as CollabUser
      if (key !== user.id && presence) collab.upsertUser(presence)
    })

    channel.on('presence', { event: 'leave' }, ({ key }) => {
      if (key !== user.id) collab.removeUser(key)
    })

    // ── Broadcast: canvas dəyişiklikləri ──────────────────────────────────
    channel.on(
      'broadcast',
      { event: 'canvas' },
      ({ payload }: { payload: CollabEvent }) => {
        if (payload.userId === user.id) return
        handleIncomingEvent(payload)
      }
    )

    // ── Cursor broadcast ──────────────────────────────────────────────────
    channel.on(
      'broadcast',
      { event: 'cursor' },
      ({ payload }: { payload: { userId: string; cursor: Point | null } }) => {
        if (payload.userId === user.id) return
        collab.updateCursor(payload.userId, payload.cursor)
      }
    )

    // ── Kanala qoşul ──────────────────────────────────────────────────────
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        collab.setConnected(true)
        collab.setConnecting(false)

        await channel.track({
          userId:      user.id,
          name:        profile?.full_name ?? user.email ?? 'Anonymous',
          avatar:      profile?.avatar_url ?? null,
          color:       getUserColor(user.id),
          cursor:      null,
          selectedIds: [],
          lastSeen:    Date.now(),
        } satisfies CollabUser)
      }

      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        collab.setConnected(false)
        collab.setConnecting(false)
        console.error('[Collab] Channel error:', status)
      }
    })

    channelRef.current = channel
    collab.setChannel(channel)

    return () => {
      if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current)
      channel.unsubscribe()
      collab.setConnected(false)
      collab.clearUsers()
      collab.setChannel(null)
      channelRef.current = null
    }
  }, [sceneId, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Element broadcast funksiyaları ────────────────────────────────────────

  const broadcastElementAdd = useCallback((element: CanvasElement) => {
    if (!channelRef.current || !user || !isPro) return

    const event: CollabEvent = {
      type:      'element_add',
      userId:    user.id,
      sceneId,
      timestamp: Date.now(),
      payload:   { type: 'element_add', element },
    }

    channelRef.current.send({ type: 'broadcast', event: 'canvas', payload: event })
  }, [user, sceneId, isPro])

  const broadcastElementUpdate = useCallback((
    id:      string,
    updates: Partial<CanvasElement>,
    version: number
  ) => {
    if (!channelRef.current || !user || !isPro) return

    if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current)

    syncDebounceRef.current = setTimeout(() => {
      const event: CollabEvent = {
        type:      'element_update',
        userId:    user.id,
        sceneId,
        timestamp: Date.now(),
        payload:   { type: 'element_update', id, updates, version },
      }

      channelRef.current?.send({ type: 'broadcast', event: 'canvas', payload: event })
    }, SYNC_DEBOUNCE_MS)
  }, [user, sceneId, isPro])

  const broadcastElementDelete = useCallback((ids: string[]) => {
    if (!channelRef.current || !user || !isPro) return

    const event: CollabEvent = {
      type:      'element_delete',
      userId:    user.id,
      sceneId,
      timestamp: Date.now(),
      payload:   { type: 'element_delete', ids },
    }

    channelRef.current.send({ type: 'broadcast', event: 'canvas', payload: event })
  }, [user, sceneId, isPro])

  const broadcastSceneClear = useCallback(() => {
    if (!channelRef.current || !user || !isPro) return

    const event: CollabEvent = {
      type:      'scene_clear',
      userId:    user.id,
      sceneId,
      timestamp: Date.now(),
      payload:   { type: 'scene_clear' },
    }

    channelRef.current.send({ type: 'broadcast', event: 'canvas', payload: event })
  }, [user, sceneId, isPro])

  // ── Cursor broadcast ──────────────────────────────────────────────────────
  const broadcastCursor = useCallback((cursor: Point | null) => {
    if (!channelRef.current || !user) return

    const now = Date.now()
    if (now - lastCursorSend.current < CURSOR_THROTTLE_MS) return
    lastCursorSend.current = now

    channelRef.current.send({
      type:    'broadcast',
      event:   'cursor',
      payload: { userId: user.id, cursor },
    })
  }, [user])

  // ── Seçimi broadcast et ───────────────────────────────────────────────────
  const broadcastSelection = useCallback((selectedIds: string[]) => {
    if (!channelRef.current || !user) return

    const event: CollabEvent = {
      type:      'user_selection',
      userId:    user.id,
      sceneId,
      timestamp: Date.now(),
      payload:   { type: 'user_selection', selectedIds },
    }

    channelRef.current.send({ type: 'broadcast', event: 'canvas', payload: event })

    channelRef.current.track({
      userId:      user.id,
      name:        profile?.full_name ?? user.email ?? 'Anonymous',
      avatar:      profile?.avatar_url ?? null,
      color:       getUserColor(user.id),
      cursor:      null,
      selectedIds,
      lastSeen:    Date.now(),
    } satisfies CollabUser)
  }, [user, sceneId, profile])

  return {
    isConnected:  collab.isConnected,
    isConnecting: collab.isConnecting,
    activeUsers:  collab.activeUsers,

    broadcastElementAdd,
    broadcastElementUpdate,
    broadcastElementDelete,
    broadcastSceneClear,
    broadcastCursor,
    broadcastSelection,
  }
}
