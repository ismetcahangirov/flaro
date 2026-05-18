import { useMemo } from 'react'
import { useCollabStore } from '@/store/collabStore'
import { useCanvasStore } from '@/store/canvasStore'
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
  user:    CollabUser
  zoom:    number
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
        transform:  `translate(${screenX}px, ${screenY}px)`,
        transition: 'transform 50ms linear',
      }}
    >
      <CursorIcon color={user.color} />

      {/* Digər istifadəçilərin seçim overlay-i */}
      {user.selectedIds.length > 0 && (
        <div
          className="absolute -top-1 -left-1 w-2 h-2 rounded-full"
          style={{ backgroundColor: colorWithAlpha(user.color, 0.6) }}
        />
      )}

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
  const { activeUsers }          = useCollabStore()
  const { appState }             = useCanvasStore()
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
