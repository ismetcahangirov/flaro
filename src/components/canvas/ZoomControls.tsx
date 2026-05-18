import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Undo2, Redo2 } from 'lucide-react'
import { useCanvasStore } from '@/store/canvasStore'
import { Tooltip } from '@/components/ui/Tooltip'

export function ZoomControls() {
  const store = useCanvasStore()
  const zoomPercent = Math.round(store.appState.zoom * 100)

  const handleZoomOut = () => {
    store.setZoom(store.appState.zoom - 0.1)
  }

  const handleZoomIn = () => {
    store.setZoom(store.appState.zoom + 0.1)
  }

  return (
    <div className="absolute bottom-6 left-6 z-20 flex items-center gap-3">
      {/* Zoom control bar */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-lg p-1.5 flex items-center gap-1">
        <Tooltip content="Kiçilt" side="top">
          <button
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all active:scale-95"
          >
            <ZoomOut size={16} />
          </button>
        </Tooltip>

        <button
          onClick={store.resetView}
          className="px-2 text-xs font-bold text-slate-600 hover:text-slate-950 transition-colors"
          title="Zoom-u sıfırla"
        >
          {zoomPercent}%
        </button>

        <Tooltip content="Böyüt" side="top">
          <button
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all active:scale-95"
          >
            <ZoomIn size={16} />
          </button>
        </Tooltip>

        <div className="w-px h-5 bg-slate-100 mx-1" />

        <Tooltip content="Ekrana sığdır" side="top">
          <button
            onClick={store.zoomToFit}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all active:scale-95"
          >
            <Maximize2 size={15} />
          </button>
        </Tooltip>

        <Tooltip content="Görünüşü sıfırla" side="top">
          <button
            onClick={store.resetView}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all active:scale-95"
          >
            <RotateCcw size={15} />
          </button>
        </Tooltip>
      </div>

      {/* History control bar */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-lg p-1.5 flex items-center gap-1">
        <Tooltip content="Geri al (Ctrl+Z)" side="top">
          <button
            onClick={store.undo}
            disabled={!store.canUndo()}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
          >
            <Undo2 size={15} />
          </button>
        </Tooltip>

        <Tooltip content="İrəli al (Ctrl+Y)" side="top">
          <button
            onClick={store.redo}
            disabled={!store.canRedo()}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
          >
            <Redo2 size={15} />
          </button>
        </Tooltip>
      </div>
    </div>
  )
}
