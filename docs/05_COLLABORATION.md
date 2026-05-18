# Flaro — Real-time Əməkdaşlıq

> **Supabase Realtime** — Cursor sync, element sync, presence, conflict resolution
> TypeScript strict mode ilə tam tipləşdirilmiş

---

## 🔄 Collaboration Arxitekturası

```
┌──────────────────────────────────────────────────────────────────┐
│                    REALTIME PIPELINE                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   User A (Editor)              User B (Editor)                   │
│        │                            │                            │
│        ▼                            ▼                            │
│   canvasStore                  canvasStore                       │
│        │                            │                            │
│        ▼                            ▼                            │
│   useCollaboration             useCollaboration                  │
│        │                            │                            │
│        └──────────┐   ┌─────────────┘                            │
│                   ▼   ▼                                          │
│          Supabase Realtime Channel                               │
│          "scene:{sceneId}"                                       │
│                   │                                              │
│          ┌────────┴──────────┐                                   │
│          │                   │                                   │
│    Broadcast             Presence                                │
│    (elements,            (cursors,                               │
│     actions)              online users)                          │
│                                                                  │
│  Conflict Resolution:                                            │
│  Last-Write-Wins (LWW) + element version counter                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📝 TypeScript Tipləri

### `src/types/collaboration.types.ts`

```typescript
import type { CanvasElement, AppState, Point } from './canvas.types'
import type { Profile } from './database.types'

// ── Presence (online istifadəçilər) ──────────────────────────────────────────

export interface CollabUser {
  userId:    string
  name:      string
  avatar:    string | null
  color:     string           // Unikal rəng (cursor, seçim)
  cursor:    Point | null     // Canvas koordinatı
  selectedIds: string[]       // Hazırda seçdiyi element-lər
  lastSeen:  number           // Timestamp
}

// ── Broadcast mesaj tipləri ───────────────────────────────────────────────────

export type CollabEventType =
  | 'element_add'
  | 'element_update'
  | 'element_delete'
  | 'elements_batch'    // Çoxlu dəyişiklik eyni anda
  | 'scene_clear'
  | 'cursor_move'       // Presence ilə idarə olunur — alternativ
  | 'user_selection'

export interface CollabEvent {
  type:      CollabEventType
  userId:    string
  sceneId:   string
  timestamp: number
  payload:   CollabPayload
}

export type CollabPayload =
  | { type: 'element_add';    element:  CanvasElement }
  | { type: 'element_update'; id: string; updates: Partial<CanvasElement>; version: number }
  | { type: 'element_delete'; ids: string[] }
  | { type: 'elements_batch'; elements: CanvasElement[] }
  | { type: 'scene_clear' }
  | { type: 'cursor_move';    cursor: Point | null }
  | { type: 'user_selection'; selectedIds: string[] }

// ── Collaboration store state ─────────────────────────────────────────────────

export interface CollabState {
  isConnected:   boolean
  isConnecting:  boolean
  activeUsers:   Map<string, CollabUser>
  channelRef:    any | null   // RealtimeChannel
}
```

---

## 🎨 İstifadəçi Rəngləri

### `src/lib/collabColors.ts`

```typescript
// Hər istifadəçiyə unikal rəng — orange ailəsi + digər canlı rənglər
const COLLAB_COLORS = [
  '#F97316',  // Orange (brand)
  '#3B82F6',  // Blue
  '#10B981',  // Emerald
  '#8B5CF6',  // Violet
  '#EF4444',  // Red
  '#F59E0B',  // Amber
  '#06B6D4',  // Cyan
  '#EC4899',  // Pink
  '#84CC16',  // Lime
  '#6366F1',  // Indigo
] as const

// UserId-dən deterministik rəng seç (eyni user həmişə eyni rəng)
export function getUserColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLLAB_COLORS[Math.abs(hash) % COLLAB_COLORS.length]
}

// Rəngi yarı şəffaf et (seçim overlay üçün)
export function colorWithAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
```

---

## 🗃️ Collaboration Store (Zustand)

### `src/store/collabStore.ts`

```typescript
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { CollabUser, CollabState } from '@/types/collaboration.types'

interface CollabStore extends CollabState {
  // Actions
  setConnected:    (connected: boolean)  => void
  setConnecting:   (connecting: boolean) => void
  setChannel:      (channel: any | null) => void

  upsertUser:      (user: CollabUser)    => void
  removeUser:      (userId: string)      => void
  updateCursor:    (userId: string, cursor: CollabUser['cursor']) => void
  updateSelection: (userId: string, selectedIds: string[]) => void
  clearUsers:      () => void
}

export const useCollabStore = create<CollabStore>()(
  devtools(
    immer((set) => ({
      isConnected:  false,
      isConnecting: false,
      activeUsers:  new Map(),
      channelRef:   null,

      setConnected:  (isConnected)  => set((s) => { s.isConnected  = isConnected  }),
      setConnecting: (isConnecting) => set((s) => { s.isConnecting = isConnecting }),
      setChannel:    (channelRef)   => set((s) => { s.channelRef   = channelRef   }),

      upsertUser: (user) => set((s) => {
        s.activeUsers.set(user.userId, user)
      }),

      removeUser: (userId) => set((s) => {
        s.activeUsers.delete(userId)
      }),

      updateCursor: (userId, cursor) => set((s) => {
        const user = s.activeUsers.get(userId)
        if (user) user.cursor = cursor
      }),

      updateSelection: (userId, selectedIds) => set((s) => {
        const user = s.activeUsers.get(userId)
        if (user) user.selectedIds = selectedIds
      }),

      clearUsers: () => set((s) => {
        s.activeUsers.clear()
      }),
    })),
    { name: 'CollabStore' }
  )
)
```

---

## 🪝 useCollaboration Hook

### `src/hooks/useCollaboration.ts`

```typescript
import { useEffect, useRef, useCallback } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useCanvasStore } from '@/store/canvasStore'
import { useCollabStore }  from '@/store/collabStore'
import { useAuth }         from '@/hooks/useAuth'
import { getUserColor }    from '@/lib/collabColors'
import type {
  CollabEvent,
  CollabPayload,
  CollabUser,
} from '@/types/collaboration.types'
import type { Point } from '@/types/canvas.types'

// Cursor throttle — 50ms-dən bir göndər
const CURSOR_THROTTLE_MS = 50
// Element sync debounce — 300ms
const SYNC_DEBOUNCE_MS   = 300

export function useCollaboration(sceneId: string) {
  const { user, profile, isPro }  = useAuth()
  const canvas  = useCanvasStore()
  const collab  = useCollabStore()

  const channelRef       = useRef<RealtimeChannel | null>(null)
  const lastCursorSend   = useRef<number>(0)
  const syncDebounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isBroadcasting   = useRef(false)   // Öz broadcast-ını filter et

  // ── Kanalı qur ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !sceneId) return

    // Pro olmayan user-lar yalnız oxuya bilər
    // (Realtime-a connect olurlar amma broadcast etmirlər)

    collab.setConnecting(true)

    const channel = supabase.channel(`scene:${sceneId}`, {
      config: {
        presence: { key: user.id },
        broadcast: { self: false },   // Öz mesajlarını alma
      },
    })

    // ── Presence: online istifadəçilər ────────────────────────────────────
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<CollabUser>()

      Object.entries(state).forEach(([userId, presences]) => {
        if (userId === user.id) return
        const latest = presences[presences.length - 1] as unknown as CollabUser
        collab.upsertUser(latest)
      })
    })

    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      const presence = newPresences[0] as unknown as CollabUser
      if (key !== user.id) collab.upsertUser(presence)
    })

    channel.on('presence', { event: 'leave' }, ({ key }) => {
      if (key !== user.id) collab.removeUser(key)
    })

    // ── Broadcast: canvas dəyişiklikləri ──────────────────────────────────
    channel.on(
      'broadcast',
      { event: 'canvas' },
      ({ payload }: { payload: CollabEvent }) => {
        if (payload.userId === user.id) return  // Öz mesajı

        handleIncomingEvent(payload)
      }
    )

    // ── Cursor broadcast (ayrı event) ─────────────────────────────────────
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

        // Presence state-i yayımla
        await channel.track({
          userId:     user.id,
          name:       profile?.full_name ?? user.email ?? 'Anonymous',
          avatar:     profile?.avatar_url ?? null,
          color:      getUserColor(user.id),
          cursor:     null,
          selectedIds: [],
          lastSeen:   Date.now(),
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
      channel.unsubscribe()
      collab.setConnected(false)
      collab.clearUsers()
      collab.setChannel(null)
      channelRef.current = null
    }
  }, [sceneId, user?.id])

  // ── Gələn event-i işlə ────────────────────────────────────────────────────
  const handleIncomingEvent = useCallback((event: CollabEvent) => {
    if (isBroadcasting.current) return

    const { payload } = event

    switch (payload.type) {
      case 'element_add':
        // Artıq mövcuddursa əlavə etmə
        if (!canvas.elements.find(e => e.id === payload.element.id)) {
          canvas.addElement(payload.element)
        }
        break

      case 'element_update': {
        const local = canvas.elements.find(e => e.id === payload.id)
        // Last-Write-Wins: gələn versiya daha yenidirsə tətbiq et
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
        // Tam canvas yeniləməsi (scene yükləndikdə)
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

  // ── Element dəyişikliklərini broadcast et ─────────────────────────────────
  const broadcastElementAdd = useCallback((element: import('@/types/canvas.types').CanvasElement) => {
    if (!channelRef.current || !user || !isPro) return

    const event: CollabEvent = {
      type:      'element_add',
      userId:    user.id,
      sceneId,
      timestamp: Date.now(),
      payload:   { type: 'element_add', element },
    }

    channelRef.current.send({
      type:    'broadcast',
      event:   'canvas',
      payload: event,
    })
  }, [user, sceneId, isPro])

  const broadcastElementUpdate = useCallback((
    id:      string,
    updates: Partial<import('@/types/canvas.types').CanvasElement>,
    version: number
  ) => {
    if (!channelRef.current || !user || !isPro) return

    // Debounce: sürətli dəyişiklikləri birləşdir
    if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current)

    syncDebounceRef.current = setTimeout(() => {
      const event: CollabEvent = {
        type:      'element_update',
        userId:    user.id,
        sceneId,
        timestamp: Date.now(),
        payload:   { type: 'element_update', id, updates, version },
      }

      channelRef.current?.send({
        type:    'broadcast',
        event:   'canvas',
        payload: event,
      })
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

    channelRef.current.send({
      type:    'broadcast',
      event:   'canvas',
      payload: event,
    })
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

    channelRef.current.send({
      type:    'broadcast',
      event:   'canvas',
      payload: event,
    })
  }, [user, sceneId, isPro])

  // ── Cursor hərəkətini broadcast et ────────────────────────────────────────
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

    channelRef.current.send({
      type:    'broadcast',
      event:   'canvas',
      payload: event,
    })

    // Presence-i də yenilə
    channelRef.current.track({
      userId:     user.id,
      name:       profile?.full_name ?? user.email ?? 'Anonymous',
      avatar:     profile?.avatar_url ?? null,
      color:      getUserColor(user.id),
      cursor:     null,
      selectedIds,
      lastSeen:   Date.now(),
    } satisfies CollabUser)
  }, [user, sceneId, profile])

  return {
    isConnected:   collab.isConnected,
    isConnecting:  collab.isConnecting,
    activeUsers:   collab.activeUsers,

    broadcastElementAdd,
    broadcastElementUpdate,
    broadcastElementDelete,
    broadcastSceneClear,
    broadcastCursor,
    broadcastSelection,
  }
}
```

---

## 🖱️ Cursor Overlay Komponenti

### `src/components/collaboration/CursorOverlay.tsx`

```typescript
import React, { useMemo } from 'react'
import { useCollabStore }  from '@/store/collabStore'
import { useCanvasStore }  from '@/store/canvasStore'
import { colorWithAlpha }  from '@/lib/collabColors'
import type { CollabUser } from '@/types/collaboration.types'

// SVG cursor ikonu
function CursorIcon({ color }: { color: string }) {
  return (
    <svg
      width="16" height="20"
      viewBox="0 0 16 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 0L0 16L4.5 12L7.5 19L9.5 18L6.5 11L12 11L0 0Z"
        fill={color}
        stroke="white"
        strokeWidth="1.5"
      />
    </svg>
  )
}

interface CursorProps {
  user: CollabUser
  zoom: number
  scrollX: number
  scrollY: number
}

function RemoteCursor({ user, zoom, scrollX, scrollY }: CursorProps) {
  if (!user.cursor) return null

  const screenX = user.cursor.x * zoom + scrollX
  const screenY = user.cursor.y * zoom + scrollY

  return (
    <div
      className="pointer-events-none absolute top-0 left-0 z-50"
      style={{
        transform: `translate(${screenX}px, ${screenY}px)`,
        transition: 'transform 50ms linear',
      }}
    >
      <CursorIcon color={user.color} />

      {/* Ad etiketi */}
      <div
        className="absolute top-5 left-2 px-2 py-0.5 rounded-full text-white text-xs
                   font-medium whitespace-nowrap shadow-sm"
        style={{ backgroundColor: user.color }}
      >
        {user.name}
      </div>
    </div>
  )
}

export function CursorOverlay() {
  const { activeUsers }    = useCollabStore()
  const { appState }       = useCanvasStore()
  const { zoom, scrollX, scrollY } = appState

  const users = useMemo(
    () => Array.from(activeUsers.values()),
    [activeUsers]
  )

  if (users.length === 0) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {users.map(user => (
        <RemoteCursor
          key={user.userId}
          user={user}
          zoom={zoom}
          scrollX={scrollX}
          scrollY={scrollY}
        />
      ))}
    </div>
  )
}
```

---

## 👥 Active Users Komponenti

### `src/components/collaboration/ActiveUsers.tsx`

```typescript
import React, { useState } from 'react'
import { Users } from 'lucide-react'
import { useCollabStore }   from '@/store/collabStore'
import { colorWithAlpha }   from '@/lib/collabColors'
import { useAuth }          from '@/hooks/useAuth'

const MAX_VISIBLE = 4

export function ActiveUsers() {
  const { activeUsers, isConnected } = useCollabStore()
  const { profile }                  = useAuth()
  const [showAll, setShowAll]        = useState(false)

  const users = Array.from(activeUsers.values())
  const total = users.length + 1  // +1 özün üçün

  const visible   = users.slice(0, MAX_VISIBLE)
  const remaining = Math.max(total - MAX_VISIBLE - 1, 0)

  return (
    <div className="flex items-center gap-2">
      {/* Bağlantı indikatoru */}
      <div className="flex items-center gap-1.5">
        <div
          className={`w-2 h-2 rounded-full transition-colors ${
            isConnected ? 'bg-emerald-500' : 'bg-gray-400'
          }`}
        />
        <span className="text-xs text-gray-500 hidden sm:block">
          {isConnected ? `${total} online` : 'Bağlanır...'}
        </span>
      </div>

      {/* Avatar-lar */}
      <div
        className="flex -space-x-2 cursor-pointer"
        onClick={() => setShowAll(v => !v)}
        title="Online istifadəçilər"
      >
        {/* Öz avatar-ı */}
        <Avatar
          name={profile?.full_name ?? 'Siz'}
          avatar={profile?.avatar_url}
          color="#F97316"
          isSelf
        />

        {/* Digər istifadəçilər */}
        {visible.map(user => (
          <Avatar
            key={user.userId}
            name={user.name}
            avatar={user.avatar}
            color={user.color}
          />
        ))}

        {/* Qalan say */}
        {remaining > 0 && (
          <div
            className="w-8 h-8 rounded-full border-2 border-white bg-gray-100
                       flex items-center justify-center text-xs font-semibold
                       text-gray-600 z-10"
          >
            +{remaining}
          </div>
        )}
      </div>

      {/* Açılır siyahı */}
      {showAll && (
        <div
          className="absolute top-12 right-4 bg-white rounded-xl shadow-lg
                     border border-gray-100 p-3 z-50 min-w-[200px]"
        >
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Online — {total} nəfər
          </p>

          {/* Öz sırası */}
          <UserRow
            name={(profile?.full_name ?? 'Siz') + ' (siz)'}
            avatar={profile?.avatar_url}
            color="#F97316"
          />

          {users.map(user => (
            <UserRow
              key={user.userId}
              name={user.name}
              avatar={user.avatar}
              color={user.color}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Alt komponentlər ─────────────────────────────────────────────────────────

interface AvatarProps {
  name:   string
  avatar: string | null | undefined
  color:  string
  isSelf?: boolean
}

function Avatar({ name, avatar, color, isSelf }: AvatarProps) {
  return (
    <div
      className="relative w-8 h-8 rounded-full border-2 border-white
                 flex items-center justify-center text-white text-xs
                 font-bold uppercase overflow-hidden shadow-sm"
      style={{
        backgroundColor: color,
        zIndex:          isSelf ? 20 : 10,
      }}
      title={name}
    >
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          className="w-full h-full object-cover"
        />
      ) : (
        name.charAt(0)
      )}

      {/* Online nöqtəsi */}
      <span
        className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500
                   rounded-full border-2 border-white"
      />
    </div>
  )
}

function UserRow({ name, avatar, color }: AvatarProps) {
  return (
    <div className="flex items-center gap-2.5 py-1.5 px-1 rounded-lg hover:bg-gray-50">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center
                   text-white text-xs font-bold uppercase overflow-hidden flex-shrink-0"
        style={{ backgroundColor: color }}
      >
        {avatar ? (
          <img src={avatar} alt={name} className="w-full h-full object-cover" />
        ) : (
          name.charAt(0)
        )}
      </div>
      <span className="text-sm text-gray-700 truncate">{name}</span>
      <div className="ml-auto w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />
    </div>
  )
}
```

---

## 💬 Comments Komponenti (Pro)

### `src/components/collaboration/Comments.tsx`

```typescript
import React, { useState, useEffect } from 'react'
import { MessageSquare, X, Check, Send } from 'lucide-react'
import { supabase }          from '@/lib/supabase'
import { useAuth }           from '@/hooks/useAuth'
import { useCanvasStore }    from '@/store/canvasStore'
import { sanitizeComment }   from '@/lib/sanitize'
import type { Comment }      from '@/types/database.types'
import type { Point }        from '@/types/canvas.types'

interface CommentWithAuthor extends Comment {
  author: {
    full_name:  string | null
    avatar_url: string | null
  }
  replies: CommentWithAuthor[]
}

interface CommentsLayerProps {
  sceneId: string
}

export function CommentsLayer({ sceneId }: CommentsLayerProps) {
  const { isPro, user }       = useAuth()
  const { appState }          = useCanvasStore()
  const [comments, setComments] = useState<CommentWithAuthor[]>([])
  const [pendingPos, setPendingPos] = useState<Point | null>(null)
  const [newText, setNewText] = useState('')
  const [isPosting, setIsPosting] = useState(false)

  // Yalnız Pro
  if (!isPro) return null

  // ── Şərhlər yüklə ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          author: profiles!user_id (full_name, avatar_url)
        `)
        .eq('scene_id', sceneId)
        .is('parent_id', null)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setComments(data as CommentWithAuthor[])
      }
    }

    fetchComments()

    // Realtime abunəlik
    const channel = supabase
      .channel(`comments:${sceneId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `scene_id=eq.${sceneId}` },
        () => fetchComments()
      )
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [sceneId])

  // ── Yeni şərh əlavə et ────────────────────────────────────────────────────
  const addComment = async () => {
    if (!pendingPos || !newText.trim() || !user) return

    setIsPosting(true)
    try {
      await supabase.from('comments').insert({
        scene_id: sceneId,
        user_id:  user.id,
        content:  sanitizeComment(newText),
        x:        pendingPos.x,
        y:        pendingPos.y,
      })

      setNewText('')
      setPendingPos(null)
    } finally {
      setIsPosting(false)
    }
  }

  // ── Şərhi həll et ─────────────────────────────────────────────────────────
  const resolveComment = async (commentId: string) => {
    await supabase
      .from('comments')
      .update({ resolved: true })
      .eq('id', commentId)
  }

  // ── Canvas kordinatından screen-ə çevir ───────────────────────────────────
  const toScreen = (x: number, y: number) => ({
    left: x * appState.zoom + appState.scrollX,
    top:  y * appState.zoom + appState.scrollY,
  })

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Mövcud şərhlər */}
      {comments
        .filter(c => !c.resolved)
        .map(comment => (
          <CommentPin
            key={comment.id}
            comment={comment}
            position={toScreen(comment.x ?? 0, comment.y ?? 0)}
            onResolve={() => resolveComment(comment.id)}
          />
        ))
      }

      {/* Yeni şərh input */}
      {pendingPos && (
        <div
          className="pointer-events-auto absolute z-50 bg-white rounded-xl
                     shadow-xl border border-gray-100 p-3 w-72"
          style={toScreen(pendingPos.x, pendingPos.y)}
        >
          <textarea
            className="w-full resize-none text-sm outline-none placeholder:text-gray-400
                       text-gray-800 min-h-[80px]"
            placeholder="Şərh əlavə edin..."
            value={newText}
            onChange={e => setNewText(e.target.value)}
            autoFocus
            maxLength={2000}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setPendingPos(null)}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg
                         hover:bg-gray-100 transition-colors"
            >
              <X size={16} />
            </button>
            <button
              onClick={addComment}
              disabled={!newText.trim() || isPosting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500
                         text-white text-sm font-medium rounded-lg
                         hover:bg-brand-600 disabled:opacity-50
                         transition-colors"
            >
              <Send size={14} />
              Göndər
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Comment Pin ───────────────────────────────────────────────────────────────

interface CommentPinProps {
  comment:   CommentWithAuthor
  position:  { left: number; top: number }
  onResolve: () => void
}

function CommentPin({ comment, position, onResolve }: CommentPinProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="pointer-events-auto absolute z-40"
      style={position}
    >
      {/* Pin ikonu */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center
                   justify-center shadow-md hover:bg-brand-600 transition-colors
                   border-2 border-white"
        title={comment.author.full_name ?? 'İstifadəçi'}
      >
        <MessageSquare size={14} />
      </button>

      {/* Açılır şərh kartı */}
      {expanded && (
        <div
          className="absolute top-10 left-0 bg-white rounded-xl shadow-xl
                     border border-gray-100 p-3 w-72 z-50"
        >
          {/* Başlıq */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-brand-500 text-white text-xs
                            flex items-center justify-center font-bold uppercase">
              {comment.author.full_name?.charAt(0) ?? '?'}
            </div>
            <span className="text-xs font-semibold text-gray-700">
              {comment.author.full_name ?? 'Anonim'}
            </span>
            <span className="text-xs text-gray-400 ml-auto">
              {new Date(comment.created_at).toLocaleDateString('az-AZ')}
            </span>
          </div>

          {/* Məzmun */}
          <p className="text-sm text-gray-700 leading-relaxed">
            {comment.content}
          </p>

          {/* Həll et düyməsi */}
          <button
            onClick={onResolve}
            className="mt-3 w-full flex items-center justify-center gap-1.5
                       py-1.5 px-3 bg-emerald-50 text-emerald-700 text-xs
                       font-medium rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <Check size={13} />
            Həll edildi kimi işarələ
          </button>
        </div>
      )}
    </div>
  )
}
```

---

## 🔗 Paylaşım Modalı (Pro + Free)

### `src/components/collaboration/ShareModal.tsx`

```typescript
import React, { useState } from 'react'
import { Link2, Copy, Check, Globe, Lock, Eye } from 'lucide-react'
import { supabase }    from '@/lib/supabase'
import { useAuth }     from '@/hooks/useAuth'
import type { Scene }  from '@/types/database.types'

interface ShareModalProps {
  scene:    Scene
  onClose:  () => void
  onUpdate: (updated: Partial<Scene>) => void
}

export function ShareModal({ scene, onClose, onUpdate }: ShareModalProps) {
  const { isPro }       = useAuth()
  const [copied, setCopied] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const shareUrl   = `${window.location.origin}/s/${scene.share_token}`
  const embedCode  = `<iframe src="${shareUrl}?embed=1" width="800" height="600" />`

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const togglePublic = async () => {
    setIsSaving(true)
    try {
      const { data } = await supabase
        .from('scenes')
        .update({ is_public: !scene.is_public })
        .eq('id', scene.id)
        .select()
        .single()

      if (data) onUpdate({ is_public: data.is_public })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center
                    bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
            <Link2 size={20} className="text-brand-500" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Paylaş</h2>
            <p className="text-sm text-gray-500">{scene.title}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Public toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50
                        rounded-xl mb-4">
          <div className="flex items-center gap-3">
            {scene.is_public
              ? <Globe size={18} className="text-brand-500" />
              : <Lock  size={18} className="text-gray-400" />
            }
            <div>
              <p className="text-sm font-medium text-gray-800">
                {scene.is_public ? 'Hamıya açıq' : 'Yalnız siz'}
              </p>
              <p className="text-xs text-gray-500">
                {scene.is_public
                  ? 'Linki olan hər kəs görə bilər'
                  : 'Paylaşım deaktivdir'
                }
              </p>
            </div>
          </div>
          <button
            onClick={togglePublic}
            disabled={isSaving}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              scene.is_public ? 'bg-brand-500' : 'bg-gray-200'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full
                          shadow-sm transition-transform ${
                scene.is_public ? 'translate-x-6' : ''
              }`}
            />
          </button>
        </div>

        {scene.is_public && (
          <>
            {/* Link kopyala */}
            <div className="flex gap-2 mb-3">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200
                           rounded-xl text-sm text-gray-600 outline-none truncate"
              />
              <button
                onClick={() => copyToClipboard(shareUrl)}
                className="px-4 py-2.5 bg-brand-500 text-white rounded-xl text-sm
                           font-medium hover:bg-brand-600 transition-colors
                           flex items-center gap-2 flex-shrink-0"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Kopyalandı' : 'Kopyala'}
              </button>
            </div>

            {/* Embed kodu — yalnız Pro */}
            {isPro ? (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase
                              tracking-wide mb-2">
                  Embed kodu
                </p>
                <div
                  className="p-3 bg-gray-50 rounded-xl font-mono text-xs
                             text-gray-600 cursor-pointer hover:bg-gray-100
                             transition-colors break-all"
                  onClick={() => copyToClipboard(embedCode)}
                >
                  {embedCode}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                <p className="text-xs text-orange-700">
                  🔒 Embed kodu Pro plan tələb edir
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
```

---

## ✅ Collaboration Xülasəsi

| Modul | Fayl | Məzmun |
|-------|------|--------|
| **Types** | `collaboration.types.ts` | `CollabUser`, `CollabEvent`, payload tipləri |
| **Colors** | `collabColors.ts` | 10 unikal rəng, deterministik seçim |
| **Store** | `collabStore.ts` | Zustand — online users, cursor state |
| **Hook** | `useCollaboration.ts` | Supabase Realtime channel, broadcast, presence |
| **Cursors** | `CursorOverlay.tsx` | Remote cursor-lar, 50ms throttle |
| **Users** | `ActiveUsers.tsx` | Avatar stack, online count, dropdown |
| **Comments** | `Comments.tsx` | Pro — canvas pin, realtime, resolve |
| **Share** | `ShareModal.tsx` | Public toggle, link copy, embed (Pro) |

**Conflict Resolution: Last-Write-Wins (LWW)**
- Hər element `version` counter-ı daşıyır
- Gələn update yalnız local version ≤ gələn version olduqda tətbiq olunur
- Broadcast debounce: 300ms — sürətli çizim zamanı flood önlənir
- Cursor throttle: 50ms — 20fps cursor sync

---

*Növbəti: `06_SUBSCRIPTION_BILLING.md` — Stripe inteqrasiyası, checkout, portal, plan UI*
