import { useState, useRef } from 'react'
import {
  MoreHorizontal, Pencil, Trash2,
  Copy, ExternalLink, Clock,
} from 'lucide-react'
import { useI18n } from '@/i18n/I18nContext'
import type { Scene } from '@/types/database.types'

interface SceneCardProps {
  scene:       Scene
  onOpen:      () => void
  onDelete:    () => void
  onRename:    (title: string) => void
  onDuplicate: () => void
}

export function SceneCard({
  scene, onOpen, onDelete, onRename, onDuplicate
}: SceneCardProps) {
  const [showMenu,    setShowMenu]    = useState(false)
  const [isRenaming,  setIsRenaming]  = useState(false)
  const [renameValue, setRenameValue] = useState(scene.title)
  const inputRef = useRef<HTMLInputElement>(null)
  const { t, locale } = useI18n()

  const formatDate = (d: string) => {
    try {
      return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
        Math.round((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        'day'
      )
    } catch {
      return locale === 'az' ? 'indi' : locale === 'tr' ? 'şimdi' : locale === 'ru' ? 'сейчас' : 'just now'
    }
  }

  const handleRenameSubmit = () => {
    if (renameValue.trim() && renameValue !== scene.title) {
      onRename(renameValue.trim())
    }
    setIsRenaming(false)
  }

  return (
    <div
      className="group bg-white rounded-2xl border border-slate-100 overflow-hidden
                 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5
                 cursor-pointer"
      onClick={!isRenaming ? onOpen : undefined}
    >
      {/* Thumbnail */}
      <div className="h-36 bg-gradient-to-br from-orange-50 to-amber-50 relative
                      overflow-hidden">
        {scene.thumbnail_url ? (
          <img
            src={scene.thumbnail_url}
            alt={scene.title || t.dashboard.untitled}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Pencil size={32} className="text-orange-200" strokeWidth={1.5} />
          </div>
        )}

        {/* Üzərinə gəldikdə "Aç" overlay */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100
                        transition-opacity flex items-center justify-center">
          <div className="bg-white/90 text-slate-800 px-4 py-2 rounded-xl
                          text-sm font-semibold flex items-center gap-2">
            <ExternalLink size={14} />
            {t.dashboard.open}
          </div>
        </div>
      </div>

      {/* Məlumatlar */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          {isRenaming ? (
            <input
              ref={inputRef}
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={e => {
                if (e.key === 'Enter') handleRenameSubmit()
                if (e.key === 'Escape') setIsRenaming(false)
              }}
              onClick={e => e.stopPropagation()}
              autoFocus
              className="flex-1 text-sm font-semibold text-slate-900 border-b-2
                         border-orange-500 outline-none bg-transparent"
            />
          ) : (
            <h3 className="text-sm font-semibold text-slate-900 truncate flex-1">
              {scene.title || t.dashboard.untitled}
            </h3>
          )}

          {/* Kontekst menyusu */}
          <div className="relative flex-shrink-0">
            <button
              onClick={e => { e.stopPropagation(); setShowMenu(v => !v) }}
              className="w-7 h-7 rounded-lg flex items-center justify-center
                         text-slate-400 hover:bg-slate-100 hover:text-slate-600
                         transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal size={15} />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-8 bg-white rounded-xl shadow-xl
                           border border-slate-100 py-1.5 z-50 w-44 animate-slide-down"
                onClick={e => e.stopPropagation()}
              >
                <MenuAction
                  icon={<Pencil size={14}/>}
                  label={t.dashboard.rename}
                  onClick={() => { setIsRenaming(true); setShowMenu(false) }}
                />
                <MenuAction
                  icon={<Copy size={14}/>}
                  label={t.dashboard.duplicate}
                  onClick={() => { onDuplicate(); setShowMenu(false) }}
                />
                <div className="my-1 border-t border-slate-100" />
                <MenuAction
                  icon={<Trash2 size={14}/>}
                  label={t.dashboard.delete}
                  onClick={() => { onDelete(); setShowMenu(false) }}
                  danger
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
          <Clock size={11} />
          <span>{formatDate(scene.updated_at)}</span>
        </div>
      </div>
    </div>
  )
}

function MenuAction({
  icon, label, onClick, danger = false
}: {
  icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left
                  transition-colors ${
        danger
          ? 'text-red-500 hover:bg-red-50'
          : 'text-slate-700 hover:bg-slate-50'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
