import { useState } from 'react'
import { useCollabStore } from '@/store/collabStore'
import { useAuth }        from '@/hooks/useAuth'

const MAX_VISIBLE = 4

interface AvatarBubbleProps {
  name:   string
  avatar: string | null | undefined
  color:  string
  isSelf?: boolean
}

function AvatarBubble({ name, avatar, color, isSelf = false }: AvatarBubbleProps) {
  return (
    <div
      className="relative w-8 h-8 rounded-full border-2 border-white
                 flex items-center justify-center text-white text-xs
                 font-bold uppercase overflow-hidden shadow-sm cursor-default"
      style={{
        backgroundColor: color,
        zIndex:          isSelf ? 20 : 10,
      }}
      title={name}
    >
      {avatar ? (
        <img src={avatar} alt={name} className="w-full h-full object-cover" />
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

function UserRow({ name, avatar, color }: AvatarBubbleProps) {
  return (
    <div className="flex items-center gap-2.5 py-1.5 px-1 rounded-lg hover:bg-slate-50">
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
      <span className="text-sm text-slate-700 truncate">{name}</span>
      <div className="ml-auto w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />
    </div>
  )
}

export function ActiveUsers() {
  const { activeUsers, isConnected } = useCollabStore()
  const { profile }                  = useAuth()
  const [showAll, setShowAll]        = useState(false)

  const users   = Array.from(activeUsers.values())
  const total   = users.length + 1  // +1 özün üçün
  const visible = users.slice(0, MAX_VISIBLE)
  const remaining = Math.max(total - MAX_VISIBLE - 1, 0)

  return (
    <div className="relative flex items-center gap-2">
      {/* Bağlantı indikatoru */}
      <div className="flex items-center gap-1.5">
        <div
          className={`w-2 h-2 rounded-full transition-colors ${
            isConnected ? 'bg-emerald-500 shadow-[0_0_4px_#10b981]' : 'bg-slate-300'
          }`}
        />
        <span className="text-xs text-slate-500 hidden sm:block font-medium">
          {isConnected ? `${total} online` : 'Bağlanır...'}
        </span>
      </div>

      {/* Avatar stack */}
      <div
        className="flex -space-x-2 cursor-pointer"
        onClick={() => setShowAll(v => !v)}
        title="Online istifadəçilər"
      >
        {/* Öz avatar-ı */}
        <AvatarBubble
          name={profile?.full_name ?? 'Siz'}
          avatar={profile?.avatar_url}
          color="#F97316"
          isSelf
        />

        {visible.map(user => (
          <AvatarBubble
            key={user.userId}
            name={user.name}
            avatar={user.avatar}
            color={user.color}
          />
        ))}

        {remaining > 0 && (
          <div
            className="w-8 h-8 rounded-full border-2 border-white bg-slate-100
                       flex items-center justify-center text-xs font-semibold
                       text-slate-600"
          >
            +{remaining}
          </div>
        )}
      </div>

      {/* Dropdown siyahı */}
      {showAll && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowAll(false)}
          />
          <div
            className="absolute top-10 right-0 bg-white rounded-xl shadow-xl
                       border border-slate-100 p-3 z-50 min-w-[200px] animate-slide-down"
          >
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Online — {total} nəfər
            </p>

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
        </>
      )}
    </div>
  )
}
