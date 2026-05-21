import React, { useState, useEffect } from 'react'
import { MessageSquare, X, Check, Send } from 'lucide-react'
import { supabase }        from '@/lib/supabase'
import { useAuth }         from '@/hooks/useAuth'
import { useCanvasStore }  from '@/store/canvasStore'
import { sanitizeComment } from '@/lib/sanitize'
import type { Comment }    from '@/types/database.types'
import type { Point }      from '@/types/canvas.types'
import { useI18n }         from '@/i18n/I18nContext'

interface CommentWithAuthor extends Comment {
  author: {
    full_name:  string | null
    avatar_url: string | null
  }
}

interface CommentsLayerProps {
  sceneId: string
}

const dict: Record<'az' | 'tr' | 'ru' | 'en', {
  addComment: string
  writeIdea: string
  send: string
  user: string
  anonymous: string
  resolved: string
  localeCode: string
}> = {
  az: {
    addComment: 'Şərh əlavə et',
    writeIdea: 'Fikrinizi yazın...',
    send: 'Göndər',
    user: 'İstifadəçi',
    anonymous: 'Anonim',
    resolved: 'Həll edildi',
    localeCode: 'az-AZ',
  },
  tr: {
    addComment: 'Yorum ekle',
    writeIdea: 'Düşüncelerinizi yazın...',
    send: 'Gönder',
    user: 'Kullanıcı',
    anonymous: 'Anonim',
    resolved: 'Çözüldü',
    localeCode: 'tr-TR',
  },
  ru: {
    addComment: 'Добавить комментарий',
    writeIdea: 'Напишите ваше мнение...',
    send: 'Отправить',
    user: 'Пользователь',
    anonymous: 'Аноним',
    resolved: 'Решено',
    localeCode: 'ru-RU',
  },
  en: {
    addComment: 'Add comment',
    writeIdea: 'Write your thoughts...',
    send: 'Send',
    user: 'User',
    anonymous: 'Anonymous',
    resolved: 'Resolved',
    localeCode: 'en-US',
  }
}

export function CommentsLayer({ sceneId }: CommentsLayerProps) {
  const { isPro, user }             = useAuth()
  const { appState }                = useCanvasStore()
  const { locale }                  = useI18n()
  const [comments, setComments]     = useState<CommentWithAuthor[]>([])
  const [pendingPos, setPendingPos] = useState<Point | null>(null)
  const [newText, setNewText]       = useState('')
  const [isPosting, setIsPosting]   = useState(false)

  const currentDict = dict[locale as 'az' | 'tr' | 'ru' | 'en'] || dict['en']

  useEffect(() => {
    if (!isPro) return

    const fetchComments = async () => {
      const { data, error } = await (supabase as any)
        .from('comments')
        .select(`*, author: profiles!user_id (full_name, avatar_url)`)
        .eq('scene_id', sceneId)
        .is('parent_id', null)
        .order('created_at', { ascending: true })

      if (!error && data) setComments(data as CommentWithAuthor[])
    }

    fetchComments()

    const channel = supabase
      .channel(`comments:${sceneId}`)
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'comments', filter: `scene_id=eq.${sceneId}` },
        () => fetchComments()
      )
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [sceneId, isPro])

  if (!isPro) return null

  // ── Yeni şərh əlavə et ──────────────────────────────────────────────────────
  const addComment = async () => {
    if (!pendingPos || !newText.trim() || !user) return
    setIsPosting(true)
    try {
      await (supabase as any).from('comments').insert({
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

  const resolveComment = async (commentId: string) => {
    await (supabase as any)
      .from('comments')
      .update({ resolved: true })
      .eq('id', commentId)
  }

  const toScreen = (x: number, y: number) => ({
    left: x * appState.zoom + appState.scrollX,
    top:  y * appState.zoom + appState.scrollY,
  })

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvasX = (e.clientX - appState.scrollX) / appState.zoom
    const canvasY = (e.clientY - appState.scrollY) / appState.zoom
    setPendingPos({ x: canvasX, y: canvasY })
  }

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      onDoubleClick={handleDoubleClick}
    >
      {/* Mövcud şərhlər */}
      {comments
        .filter(c => !c.resolved)
        .map(comment => (
          <CommentPin
            key={comment.id}
            comment={comment}
            position={toScreen(comment.x ?? 0, comment.y ?? 0)}
            onResolve={() => resolveComment(comment.id)}
            locale={locale}
          />
        ))
      }

      {/* Yeni şərh input */}
      {pendingPos && (
        <div
          className="pointer-events-auto absolute z-50 bg-white rounded-2xl
                     shadow-2xl border border-slate-100 p-4 w-72 animate-slide-up"
          style={toScreen(pendingPos.x, pendingPos.y)}
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            {currentDict.addComment}
          </p>
          <textarea
            className="w-full resize-none text-sm outline-none placeholder:text-slate-400
                       text-slate-800 min-h-[80px] bg-slate-50 rounded-xl p-2.5
                       border border-slate-200 focus:border-orange-400 transition-colors"
            placeholder={currentDict.writeIdea}
            value={newText}
            onChange={e => setNewText(e.target.value)}
            autoFocus
            maxLength={2000}
            onKeyDown={e => {
              if (e.key === 'Enter' && e.metaKey) addComment()
              if (e.key === 'Escape') setPendingPos(null)
            }}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setPendingPos(null)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg
                         hover:bg-slate-100 transition-colors"
            >
              <X size={16} />
            </button>
            <button
              onClick={addComment}
              disabled={!newText.trim() || isPosting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500
                         text-white text-sm font-semibold rounded-xl
                         hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              <Send size={14} />
              {currentDict.send}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Comment Pin ──────────────────────────────────────────────────────────────

interface CommentPinProps {
  comment:   CommentWithAuthor
  position:  { left: number; top: number }
  onResolve: () => void
  locale:    string
}

function CommentPin({ comment, position, onResolve, locale }: CommentPinProps) {
  const [expanded, setExpanded] = useState(false)
  const currentDict = dict[locale as 'az' | 'tr' | 'ru' | 'en'] || dict['en']

  return (
    <div className="pointer-events-auto absolute z-40" style={position}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center
                   justify-center shadow-md hover:bg-orange-600 transition-colors
                   border-2 border-white"
        title={comment.author.full_name ?? currentDict.user}
      >
        <MessageSquare size={14} />
      </button>

      {expanded && (
        <div
          className="absolute top-10 left-0 bg-white rounded-2xl shadow-2xl
                     border border-slate-100 p-4 w-72 z-50 animate-slide-up"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs
                            flex items-center justify-center font-bold uppercase flex-shrink-0">
              {comment.author.full_name?.charAt(0) ?? '?'}
            </div>
            <span className="text-xs font-bold text-slate-700">
              {comment.author.full_name ?? currentDict.anonymous}
            </span>
            <span className="text-xs text-slate-400 ml-auto">
              {new Date(comment.created_at).toLocaleDateString(currentDict.localeCode)}
            </span>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed mb-3">
            {comment.content}
          </p>

          <div className="flex gap-2">
            <button
              onClick={onResolve}
              className="flex-1 flex items-center justify-center gap-1.5
                         py-1.5 px-3 bg-emerald-50 text-emerald-700 text-xs
                         font-semibold rounded-xl hover:bg-emerald-100 transition-colors"
            >
              <Check size={13} />
              {currentDict.resolved}
            </button>
            <button
              onClick={() => setExpanded(false)}
              className="py-1.5 px-2 bg-slate-50 text-slate-500 text-xs
                         font-semibold rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
