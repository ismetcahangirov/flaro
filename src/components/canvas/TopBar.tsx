import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Cloud, CloudLightning, Share2,
  Download, FileImage, Code, FileCode, Check, Copy,
  Crown
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useExport } from '@/hooks/useExport'
import { useAuth } from '@/hooks/useAuth'
import { Tooltip } from '@/components/ui/Tooltip'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface TopBarProps {
  sceneId:     string
  isSaving:    boolean
  lastSaved:   Date | null
  onSave:      () => void
  activeUsers: any[] // Collab users
}

export function TopBar({
  sceneId,
  isSaving,
  lastSaved,
  onSave,
  activeUsers = []
}: TopBarProps) {
  const navigate = useNavigate()
  const { isPro } = useAuth()
  const { exportScene, isExporting } = useExport(sceneId)

  const [title, setTitle] = useState('Untitled Scene')
  const [isEditing, setIsEditing] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  // Fetch title
  useEffect(() => {
    if (!sceneId) return
    const fetchTitle = async () => {
      const { data } = await (supabase as any)
        .from('scenes')
        .select('title')
        .eq('id', sceneId)
        .single()
      if (data?.title) setTitle(data.title)
    }
    fetchTitle()
  }, [sceneId])

  const handleTitleSubmit = async () => {
    setIsEditing(false)
    if (!title.trim() || !sceneId) return
    
    await (supabase as any)
      .from('scenes')
      .update({ title: title.trim() })
      .eq('id', sceneId)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <header className="h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between z-20 shadow-sm relative">
      {/* Sol: Back & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={e => {
                if (e.key === 'Enter') handleTitleSubmit()
                if (e.key === 'Escape') setIsEditing(false)
              }}
              autoFocus
              className="text-sm font-semibold text-slate-800 border-b-2 border-orange-500 outline-none px-1"
            />
          ) : (
            <h2
              onClick={() => setIsEditing(true)}
              className="text-sm font-bold text-slate-800 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded-lg transition-colors truncate max-w-[200px]"
            >
              {title}
            </h2>
          )}

          {/* Sync status */}
          <Tooltip content={isSaving ? 'Yadda saxlanılır...' : lastSaved ? `Son yadda saxlama: ${lastSaved.toLocaleTimeString('az')}. Yadda saxlamaq üçün klikləyin.` : 'Buludda saxlanılıb. Yadda saxlamaq üçün klikləyin.'}>
            <button onClick={onSave} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors">
              {isSaving ? (
                <CloudLightning size={14} className="text-orange-500 animate-pulse-soft" />
              ) : (
                <Cloud size={14} className="text-emerald-500" />
              )}
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Orta: Active Users (Presence) */}
      <div className="flex items-center gap-1">
        {activeUsers.slice(0, 4).map((user, idx) => (
          <Tooltip key={user.presence_ref || idx} content={user.name || 'İstifadəçi'}>
            <div>
              <Avatar name={user.name || 'U'} size="sm" />
            </div>
          </Tooltip>
        ))}
        {activeUsers.length > 4 && (
          <span className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-bold flex items-center justify-center">
            +{activeUsers.length - 4}
          </span>
        )}
      </div>

      {/* Sağ: Share & Export actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowShareModal(true)}
          className="flex items-center gap-1.5"
        >
          <Share2 size={14} />
          Paylaş
        </Button>

        {/* Export dropdown */}
        <div className="relative">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowExportMenu(!showExportMenu)}
            isLoading={isExporting}
            className="flex items-center gap-1.5"
          >
            <Download size={14} />
            Yüklə
          </Button>

          {showExportMenu && (
            <div className="absolute right-0 top-11 bg-white border border-slate-100 rounded-2xl shadow-2xl py-2 w-48 z-50 animate-slide-down">
              <ExportMenuItem
                icon={<FileImage size={14} />}
                label="PNG Şəkil"
                onClick={() => { exportScene('png'); setShowExportMenu(false) }}
              />
              <ExportMenuItem
                icon={<Code size={14} />}
                label="SVG Diaqram"
                onClick={() => { exportScene('svg'); setShowExportMenu(false) }}
              />
              <ExportMenuItem
                icon={<FileCode size={14} />}
                label="Flaro Faylı (JSON)"
                onClick={() => { exportScene('json'); setShowExportMenu(false) }}
              />
              <div className="my-1 border-t border-slate-100" />
              <ExportMenuItem
                icon={<Crown size={14} className="text-orange-500 fill-orange-500" />}
                label="PDF Sənədi"
                onClick={() => { exportScene('pdf'); setShowExportMenu(false) }}
                isProOnly={!isPro}
              />
              <ExportMenuItem
                icon={<Crown size={14} className="text-orange-500 fill-orange-500" />}
                label="PowerPoint (PPTX)"
                onClick={() => { exportScene('pptx'); setShowExportMenu(false) }}
                isProOnly={!isPro}
              />
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowShareModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-3xl p-6 border border-slate-100 shadow-2xl animate-slide-up z-10">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-3">Səhnəni Paylaşın</h3>
            <p className="text-sm text-slate-500 mb-5 leading-relaxed">
              Komanda yoldaşlarınızı birlikdə işləməyə dəvət etmək üçün aşağıdakı linki kopyalayın:
            </p>

            <div className="flex gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 mb-6">
              <input
                readOnly
                value={window.location.href}
                className="flex-1 bg-transparent text-xs text-slate-600 outline-none select-all pl-2 font-semibold"
              />
              <button
                onClick={handleCopyLink}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isCopied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
              >
                {isCopied ? <Check size={14} /> : <Copy size={14} />}
                {isCopied ? 'Kopyalandı' : 'Kopyala'}
              </button>
            </div>

            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setShowShareModal(false)}>
                Bağla
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

interface ExportMenuItemProps {
  icon:      React.ReactNode
  label:     string
  onClick:   () => void
  isProOnly?: boolean
}

function ExportMenuItem({ icon, label, onClick, isProOnly = false }: ExportMenuItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={isProOnly}
      className={`w-full flex items-center justify-between px-4 py-2.5 text-xs text-left transition-colors ${
        isProOnly
          ? 'opacity-40 cursor-not-allowed'
          : 'text-slate-700 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-2.5 font-semibold">
        {icon}
        <span>{label}</span>
      </div>
      {isProOnly && <Badge variant="orange">Pro</Badge>}
    </button>
  )
}
