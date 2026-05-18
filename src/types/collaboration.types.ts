import type { CanvasElement, Point } from './canvas.types'

// ── Presence (online istifadəçilər) ──────────────────────────────────────────

export interface CollabUser {
  userId:      string
  name:        string
  avatar:      string | null
  color:       string           // Unikal rəng (cursor, seçim)
  cursor:      Point | null     // Canvas koordinatı
  selectedIds: string[]         // Hazırda seçdiyi element-lər
  lastSeen:    number           // Timestamp
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

