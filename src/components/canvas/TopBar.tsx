import { useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Cloud, CloudLightning, Share2,
  Download, FileImage, Code, FileCode,
  Crown
} from 'lucide-react'
import { supabase }    from '@/lib/supabase'
import { useExport }   from '@/hooks/useExport'
import { useAuth }     from '@/hooks/useAuth'
import { Tooltip }     from '@/components/ui/Tooltip'
import { Badge }       from '@/components/ui/Badge'
import { Button }      from '@/components/ui/Button'

interface TopBarProps {
  sceneId:      string
  isSaving:     boolean
  lastSaved:    Date | null
  onSave:       () => void
  onShare?:     () => void
  activeUsers?: any[]       // kept for compatibility, display handled by collabSlot
  collabSlot?:  ReactNode   // <ActiveUsers /> component
}

export function TopBar({
  sceneId,
  isSaving,
  lastSaved,
  onSave,
  onShare,
  collabSlot,
}: TopBarProps) {
  const navigate = useNavigate()
  const { isPro } = useAuth()
  const { exportScene, isExporting } = useExport(sceneId)

  const [title, setTitle]           = useState('Untitled Scene')
  const [isEditing, setIsEditing]   = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

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

  // Close export menu on outside click
  useEffect(() => {
    if (!showExportMenu) return
    const handler = () => setShowExportMenu(false)
    setTimeout(() => window.addEventListener('click', handler), 0)
    return () => window.removeEventListener('click', handler)
  }, [showExportMenu])

  return (
    <header className="h-16 max-md:h-auto max-md:py-2 bg-white border-b border-slate-100 px-4 max-md:px-2 flex max-md:flex-wrap items-center justify-between z-20 shadow-sm relative gap-4 max-md:gap-2">
      {/* Sol: Back & Title */}
      <div className="flex items-center gap-3 max-md:gap-1.5 min-w-0">
        <button
          onClick={() => navigate('/dashboard')}
          className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors flex-shrink-0"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex items-center gap-2 min-w-0">
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
              className="text-sm font-semibold text-slate-800 border-b-2 border-orange-500 outline-none px-1 min-w-[120px]"
            />
          ) : (
            <h2
              onClick={() => setIsEditing(true)}
              className="text-sm font-bold text-slate-800 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded-lg transition-colors truncate max-w-[180px]"
            >
              {title}
            </h2>
          )}

          {/* Sync status */}
          <Tooltip
            content={
              isSaving
                ? 'Yadda saxlanılır...'
                : lastSaved
                ? `Son yadda saxlama: ${lastSaved.toLocaleTimeString('az')}. Klikləyin.`
                : 'Buludda saxlanılıb. Klikləyin.'
            }
          >
            <button
              onClick={onSave}
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {isSaving ? (
                <CloudLightning size={14} className="text-orange-500 animate-pulse-soft" />
              ) : (
                <Cloud size={14} className="text-emerald-500" />
              )}
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Orta: CollabSlot (ActiveUsers) */}
      <div className="flex items-center gap-2">
        {collabSlot}
      </div>

      {/* Sağ: Share & Export */}
      <div className="flex items-center gap-2 max-md:gap-1 flex-shrink-0">
        <Button
          variant="secondary"
          size="sm"
          onClick={onShare}
          className="flex items-center gap-1.5 max-md:px-2"
        >
          <Share2 size={14} />
          <span className="max-md:hidden">Paylaş</span>
        </Button>

        {/* Export dropdown */}
        <div className="relative" onClick={e => e.stopPropagation()}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowExportMenu(!showExportMenu)}
            isLoading={isExporting}
            className="flex items-center gap-1.5 max-md:px-2"
          >
            <Download size={14} />
            <span className="max-md:hidden">Yüklə</span>
          </Button>

          {showExportMenu && (
            <div className="absolute right-0 top-11 bg-white border border-slate-100 rounded-2xl shadow-2xl py-2 w-52 z-50 animate-slide-down">
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
    </header>
  )
}

interface ExportMenuItemProps {
  icon:      ReactNode
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
