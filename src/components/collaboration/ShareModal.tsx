import { useState } from 'react'
import { Link2, Copy, Check, Globe, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Scene } from '@/types/database.types'
import { useI18n } from '@/i18n/I18nContext'

interface ShareModalProps {
  scene: Scene
  onClose: () => void
  onUpdate: (updated: Partial<Scene>) => void
}

const dict: Record<'az' | 'tr' | 'ru' | 'en', {
  shareScene: string
  public: string
  private: string
  publicDesc: string
  privateDesc: string
  copied: string
  copy: string
  embedCode: string
  embedProLock: string
}> = {
  az: {
    shareScene: 'Səhnəni Paylaş',
    public: 'Hamıya açıq',
    private: 'Yalnız siz',
    publicDesc: 'Linki olan hər kəs görə bilər',
    privateDesc: 'Paylaşım deaktivdir',
    copied: 'Kopyalandı',
    copy: 'Kopyala',
    embedCode: 'Embed Kodu (Pro)',
    embedProLock: '🔒 Embed kodu Pro plan tələb edir',
  },
  tr: {
    shareScene: 'Sahneyi Paylaş',
    public: 'Herkese açık',
    private: 'Sadece siz',
    publicDesc: 'Bağlantıya sahip herkes görebilir',
    privateDesc: 'Paylaşım devre dışı',
    copied: 'Kopyalandı',
    copy: 'Kopyala',
    embedCode: 'Embed Kodu (Pro)',
    embedProLock: '🔒 Embed kodu Pro plan gerektirir',
  },
  ru: {
    shareScene: 'Поделиться сценой',
    public: 'Публичный доступ',
    private: 'Только вы',
    publicDesc: 'Все, у кого есть ссылка, могут просматривать',
    privateDesc: 'Общий доступ отключен',
    copied: 'Скопировано',
    copy: 'Копировать',
    embedCode: 'Код встраивания (Pro)',
    embedProLock: '🔒 Код встраивания требует тарифа Pro',
  },
  en: {
    shareScene: 'Share Scene',
    public: 'Public',
    private: 'Only you',
    publicDesc: 'Anyone with the link can view',
    privateDesc: 'Sharing is disabled',
    copied: 'Copied',
    copy: 'Copy',
    embedCode: 'Embed Code (Pro)',
    embedProLock: '🔒 Embed code requires Pro plan',
  }
}

export function ShareModal({ scene, onClose, onUpdate }: ShareModalProps) {
  const { isPro } = useAuth()
  const { locale } = useI18n()
  const [copied, setCopied] = useState(false)
  const [copiedEmbed, setCopiedEmbed] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const currentDict = dict[locale as 'az' | 'tr' | 'ru' | 'en'] || dict['en']

  const shareUrl = `${window.location.origin}/s/${scene.share_token}`
  const embedCode = `<iframe src="${shareUrl}?embed=1" width="800" height="600" frameborder="0" />`

  const copyToClipboard = async (text: string, isEmbed = false) => {
    await navigator.clipboard.writeText(text)
    if (isEmbed) {
      setCopiedEmbed(true)
      setTimeout(() => setCopiedEmbed(false), 2000)
    } else {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const togglePublic = async () => {
    setIsSaving(true)
    try {
      const { data } = await (supabase as any)
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />

      <div
        className="relative bg-white w-full max-w-md rounded-3xl p-6
                   border border-slate-100 shadow-2xl animate-slide-up z-10"
        onClick={e => e.stopPropagation()}
      >
        {/* Başlıq */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center">
            <Link2 size={20} className="text-orange-500" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">{currentDict.shareScene}</h2>
            <p className="text-xs text-slate-500 truncate max-w-[220px]">{scene.title}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto w-8 h-8 rounded-full hover:bg-slate-100 flex items-center
                       justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Public toggle */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl mb-4 border border-slate-100">
          <div className="flex items-center gap-3">
            {scene.is_public
              ? <Globe size={18} className="text-orange-500" />
              : <Lock size={18} className="text-slate-400" />
            }
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {scene.is_public ? currentDict.public : currentDict.private}
              </p>
              <p className="text-xs text-slate-500">
                {scene.is_public
                  ? currentDict.publicDesc
                  : currentDict.privateDesc
                }
              </p>
            </div>
          </div>
          <button
            onClick={togglePublic}
            disabled={isSaving}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 ${scene.is_public ? 'bg-orange-500' : 'bg-slate-200'
              } disabled:opacity-60`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full
                          shadow-sm transition-transform duration-300 ${scene.is_public ? 'translate-x-6' : ''
                }`}
            />
          </button>
        </div>

        {scene.is_public && (
          <>
            {/* Link kopyala */}
            <div className="flex gap-2 mb-4">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200
                           rounded-xl text-sm text-slate-600 outline-none truncate font-medium"
              />
              <button
                onClick={() => copyToClipboard(shareUrl)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold
                            flex items-center gap-1.5 flex-shrink-0 transition-all ${copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? currentDict.copied : currentDict.copy}
              </button>
            </div>

            {/* Embed kodu — yalnız Pro */}
            {isPro ? (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {currentDict.embedCode}
                </p>
                <div
                  className="p-3 bg-slate-50 rounded-xl font-mono text-xs
                             text-slate-600 cursor-pointer hover:bg-slate-100
                             transition-colors break-all border border-slate-200
                             flex items-start gap-2"
                  onClick={() => copyToClipboard(embedCode, true)}
                >
                  <span className="flex-1">{embedCode}</span>
                  {copiedEmbed
                    ? <Check size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    : <Copy size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                  }
                </div>
              </div>
            ) : (
              <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                <p className="text-xs text-orange-700 font-medium">
                  {currentDict.embedProLock}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
