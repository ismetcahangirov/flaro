import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Undo2, Redo2 } from 'lucide-react'
import { useCanvasStore } from '@/store/canvasStore'
import { Tooltip } from '@/components/ui/Tooltip'
import { useI18n } from '@/i18n/I18nContext'

export function ZoomControls() {
  const store = useCanvasStore()
  const { t, locale } = useI18n()
  const zoomPercent = Math.round(store.appState.zoom * 100)

  const handleZoomOut = () => {
    store.setZoom(store.appState.zoom - 0.1)
  }

  const handleZoomIn = () => {
    store.setZoom(store.appState.zoom + 0.1)
  }

  const resetZoomLabel = locale === 'az' ? 'Zoom-u sıfırla' : locale === 'tr' ? 'Yakınlaştırmayı sıfırla' : locale === 'ru' ? 'Сбросить масштаб' : 'Reset Zoom'
  const resetViewLabel = locale === 'az' ? 'Görünüşü sıfırla' : locale === 'tr' ? 'Görünümü sıfırla' : locale === 'ru' ? 'Сбросить вид' : 'Reset View'

  return (
    <div className="absolute bottom-20 md:bottom-6 left-1/2 md:left-6 -translate-x-1/2 md:translate-x-0 z-20 flex items-center gap-2 md:gap-3">
      {/* Zoom control bar */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-lg p-1 md:p-1.5 flex items-center gap-0.5 md:gap-1">
        <Tooltip content={t.editor.zoomOut} side="top">
          <button
            onClick={handleZoomOut}
            aria-label={t.editor.zoomOut}
            className="w-7 h-7 md:w-8 md:h-8 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all active:scale-95"
          >
            <ZoomOut size={14} />
          </button>
        </Tooltip>

        <button
          onClick={store.resetView}
          className="px-1.5 md:px-2 text-[10px] md:text-xs font-bold text-slate-600 hover:text-slate-950 transition-colors"
          title={resetZoomLabel}
        >
          {zoomPercent}%
        </button>

        <Tooltip content={t.editor.zoomIn} side="top">
          <button
            onClick={handleZoomIn}
            aria-label={t.editor.zoomIn}
            className="w-7 h-7 md:w-8 md:h-8 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all active:scale-95"
          >
            <ZoomIn size={14} />
          </button>
        </Tooltip>

        <div className="w-px h-4 md:h-5 bg-slate-100 mx-0.5 md:mx-1" />

        <Tooltip content={t.editor.fitView} side="top">
          <button
            onClick={store.zoomToFit}
            aria-label={t.editor.fitView}
            className="w-7 h-7 md:w-8 md:h-8 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all active:scale-95"
          >
            <Maximize2 size={13} />
          </button>
        </Tooltip>

        <Tooltip content={resetViewLabel} side="top">
          <button
            onClick={store.resetView}
            className="w-7 h-7 md:w-8 md:h-8 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all active:scale-95"
          >
            <RotateCcw size={13} />
          </button>
        </Tooltip>
      </div>

      {/* History control bar */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-lg p-1 md:p-1.5 flex items-center gap-0.5 md:gap-1">
        <Tooltip content={`${t.editor.undo} (Ctrl+Z)`} side="top">
          <button
            onClick={store.undo}
            disabled={!store.canUndo()}
            aria-label={t.editor.undo}
            className="w-7 h-7 md:w-8 md:h-8 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
          >
            <Undo2 size={13} />
          </button>
        </Tooltip>

        <Tooltip content={`${t.editor.redo} (Ctrl+Y)`} side="top">
          <button
            onClick={store.redo}
            disabled={!store.canRedo()}
            aria-label={t.editor.redo}
            className="w-7 h-7 md:w-8 md:h-8 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
          >
            <Redo2 size={13} />
          </button>
        </Tooltip>
      </div>
    </div>
  )
}
