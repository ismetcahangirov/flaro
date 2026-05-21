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
import { useI18n }     from '@/i18n/I18nContext'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

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
  const { t, locale } = useI18n()

  const [title, setTitle]           = useState(t.editor.untitled)
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
      if (data?.title) {
        setTitle(data.title)
      } else {
        setTitle(t.editor.untitled)
      }
    }
    fetchTitle()
  }, [sceneId, t.editor.untitled])

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

  const lastSavedText = lastSaved
    ? (locale === 'az'
      ? `Son yadda saxlama: ${lastSaved.toLocaleTimeString('az')}. Klikləyin.`
      : locale === 'tr'
      ? `Son kaydetme: ${lastSaved.toLocaleTimeString('tr')}. Tıklayın.`
      : locale === 'ru'
      ? `Последнее сохранение: ${lastSaved.toLocaleTimeString('ru')}. Кликните.`
      : `Last saved: ${lastSaved.toLocaleTimeString('en')}. Click to save.`)
    : (locale === 'az'
      ? 'Buludda saxlanılıb. Klikləyin.'
      : locale === 'tr'
      ? 'Bulutta kaydedildi. Tıklayın.'
      : locale === 'ru'
      ? 'Сохранено в облаке. Кликните.'
      : 'Saved to cloud. Click to save.')

  const pngLabel = locale === 'az' ? 'PNG Şəkil' : locale === 'tr' ? 'PNG Resmi' : locale === 'ru' ? 'Изображение PNG' : 'PNG Image'
  const svgLabel = locale === 'az' ? 'SVG Diaqram' : locale === 'tr' ? 'SVG Diyagramı' : locale === 'ru' ? 'Диаграмма SVG' : 'SVG Diagram'
  const jsonLabel = locale === 'az' ? 'Flaro Faylı (JSON)' : locale === 'tr' ? 'Flaro Dosyası (JSON)' : locale === 'ru' ? 'Файл Flaro (JSON)' : 'Flaro File (JSON)'
  const pdfLabel = locale === 'az' ? 'PDF Sənədi' : locale === 'tr' ? 'PDF Belgesi' : locale === 'ru' ? 'Документ PDF' : 'PDF Document'
  const pptxLabel = 'PowerPoint (PPTX)'

  return (
    <header className="h-14 md:h-16 bg-white border-b border-slate-100 px-2 md:px-4 flex items-center justify-between z-20 shadow-sm relative gap-2 md:gap-4">
      {/* Sol: Back & Title */}
      <div className="flex items-center gap-3 max-md:gap-1.5 min-w-0">
        <button
          onClick={() => navigate('/dashboard')}
          className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors flex-shrink-0"
          title={t.editor.back}
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
              className="text-sm font-semibold text-slate-800 border-b-2 border-orange-500 outline-none px-1 min-w-[80px] max-w-[120px] md:max-w-none"
            />
          ) : (
            <h2
              onClick={() => setIsEditing(true)}
              className="text-sm font-bold text-slate-800 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded-lg transition-colors truncate max-w-[100px] md:max-w-[180px]"
            >
              {title}
            </h2>
          )}

          {/* Sync status */}
          <Tooltip
            content={isSaving ? t.editor.saving : lastSavedText}
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
          <span className="max-md:hidden">{t.editor.share}</span>
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
            <span className="max-md:hidden">{t.editor.export}</span>
          </Button>

          {showExportMenu && (
            <div className="absolute right-0 top-11 bg-white border border-slate-100 rounded-2xl shadow-2xl py-2 w-52 z-50 animate-slide-down">
              <ExportMenuItem
                icon={<FileImage size={14} />}
                label={pngLabel}
                onClick={() => { exportScene('png'); setShowExportMenu(false) }}
              />
              <ExportMenuItem
                icon={<Code size={14} />}
                label={svgLabel}
                onClick={() => { exportScene('svg'); setShowExportMenu(false) }}
              />
              <ExportMenuItem
                icon={<FileCode size={14} />}
                label={jsonLabel}
                onClick={() => { exportScene('json'); setShowExportMenu(false) }}
              />
              <div className="my-1 border-t border-slate-100" />
              <ExportMenuItem
                icon={<Crown size={14} className="text-orange-500 fill-orange-500" />}
                label={pdfLabel}
                onClick={() => { exportScene('pdf'); setShowExportMenu(false) }}
                isProOnly={!isPro}
              />
              <ExportMenuItem
                icon={<Crown size={14} className="text-orange-500 fill-orange-500" />}
                label={pptxLabel}
                onClick={() => { exportScene('pptx'); setShowExportMenu(false) }}
                isProOnly={!isPro}
              />
            </div>
          )}
        </div>

        {/* Language Switcher */}
        <div className="border-l border-slate-200 pl-2">
          <LanguageSwitcher variant="dark" size="sm" />
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
