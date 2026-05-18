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
