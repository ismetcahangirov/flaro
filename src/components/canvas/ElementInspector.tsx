import { useState } from 'react'
import { X, Info } from 'lucide-react'
import { useCanvasStore } from '@/store/canvasStore'

const getFontWeightLabel = (weight?: number) => {
  switch (weight) {
    case 300: return 'İncə (300)'
    case 500: return 'Orta (500)'
    case 600: return 'Yarıqalın (600)'
    case 700: return 'Qalın (700)'
    case 400:
    default: return 'Normal (400)'
  }
}

export function ElementInspector() {
  const store = useCanvasStore()
  const selectedEls = store.elements.filter(e => store.selectedIds.has(e.id))
  const [isOpen, setIsOpen] = useState(window.innerWidth > 768)

  if (selectedEls.length === 0) {
    // Element seçilməyib — yalnız floating toggle göstər
    if (!isOpen) {
      return (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-4 top-1/2 -translate-y-1/2 w-8 h-16
                     bg-white border border-slate-200 rounded-l-xl
                     flex items-center justify-center shadow-lg
                     hover:bg-slate-50 transition-colors z-30
                     max-md:right-2 max-md:h-14 max-md:w-7"
          title="Panel aç"
        >
          <Info size={14} className="text-slate-400" />
        </button>
      )
    }
    // Panel açıqdır amma seçim yoxdur
    return (
      <>
        {isOpen && (
          <div
            onClick={() => setIsOpen(false)}
            className="md:hidden fixed inset-0 bg-black/30 z-40 animate-fade-in"
          />
        )}
        <aside className={`shrink-0 bg-white border-l border-slate-100 flex flex-col overflow-hidden z-10
                          relative md:relative h-[calc(100vh-56px)] md:h-[calc(100vh-64px)]
                          max-md:fixed max-md:right-0 max-md:top-0 max-md:h-full max-md:z-50
                          ${isOpen ? 'w-64 max-md:w-72' : 'w-0 md:border-l-0'}`}
                style={{ transition: 'width 0.25s ease' }}>
          <div className={`flex flex-col flex-1 min-h-0 overflow-y-auto ${isOpen ? 'opacity-100' : 'opacity-0 invisible'}`}>
            <div className="p-3 border-b border-slate-100 bg-slate-50/20 shrink-0 flex items-center justify-between gap-2">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                Element Seçin
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>
            <div className="p-4 text-center text-xs text-slate-400">
              <Info size={28} className="mx-auto mb-2 text-slate-300" />
              Xüsusiyyətləri görmək üçün bir elementə klikləyin
            </div>
          </div>
        </aside>
      </>
    )
  }

  const el = selectedEls[0]!

  return (
    <>
      {/* Mobil overlay fonu */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 bg-black/30 z-40 animate-fade-in"
        />
      )}

      {/* Panel bağlı olduqda görünən floating toggle */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-4 top-1/2 -translate-y-1/2 w-8 h-16
                     bg-white border border-slate-200 rounded-l-xl
                     flex items-center justify-center shadow-lg
                     hover:bg-slate-50 transition-colors z-30
                     max-md:right-2 max-md:h-14 max-md:w-7"
        >
          <Info size={14} className="text-slate-400" />
        </button>
      )}

      <aside className={`shrink-0 bg-white border-l border-slate-100 flex flex-col overflow-hidden z-10
                        relative md:relative h-[calc(100vh-56px)] md:h-[calc(100vh-64px)]
                        max-md:fixed max-md:right-0 max-md:top-0 max-md:h-full max-md:z-50
                        ${isOpen ? 'w-64 max-md:w-72' : 'w-0 md:border-l-0'}`}
              style={{ transition: 'width 0.25s ease' }}>

        <div className={`flex flex-col flex-1 min-h-0 overflow-y-auto ${isOpen ? 'opacity-100' : 'opacity-0 invisible'}`}>
          <div className="p-3 border-b border-slate-100 bg-slate-50/20 shrink-0 flex items-center justify-between gap-2">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
              {selectedEls.length > 1 ? `${selectedEls.length} element seçildi` : 'Element Xüsusiyyətləri'}
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Element tipi */}
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Tip</p>
              <p className="text-sm font-semibold text-slate-700 capitalize">{el.type}</p>
            </div>

            {/* Ölçülər */}
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Ölçülər</p>
              <p className="text-sm font-semibold text-slate-700">
                {Math.round(el.width)} x {Math.round(el.height)} px
              </p>
            </div>

            {/* Bucaq */}
            {el.angle !== 0 && (
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Bucaq</p>
                <p className="text-sm font-semibold text-slate-700">{Math.round((el.angle * 180) / Math.PI)}°</p>
              </div>
            )}

            {/* Xətt rəngi */}
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Xətt rəngi</p>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-lg border border-slate-200 shadow-sm"
                  style={{ backgroundColor: el.strokeColor }}
                />
                <span className="text-xs font-mono text-slate-500">{el.strokeColor}</span>
              </div>
            </div>

            {/* Doldurma rəngi */}
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Doldurma rəngi</p>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-lg border border-slate-200 shadow-sm"
                  style={{
                    backgroundColor: el.fillColor === 'transparent' ? undefined : el.fillColor,
                    backgroundImage: el.fillColor === 'transparent'
                      ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, #fff 25%, #fff 75%, #ccc 75%)'
                      : undefined,
                    backgroundSize: '8px 8px',
                  }}
                />
                <span className="text-xs font-mono text-slate-500">{el.fillColor}</span>
              </div>
            </div>

            {/* Xətt qalınlığı */}
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Xətt qalınlığı</p>
              <p className="text-sm font-semibold text-slate-700">{el.strokeWidth}px</p>
            </div>

            {/* El çizimi */}
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">El çizimi effekti</p>
              <p className="text-sm font-semibold text-slate-700">
                {el.roughness === 0 ? 'Hamar' : el.roughness === 1 ? 'Az' : el.roughness === 2 ? 'Orta' : 'Çox'}
              </p>
            </div>

            {/* Şəffaflıq */}
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Şəffaflıq</p>
              <p className="text-sm font-semibold text-slate-700">{el.opacity}%</p>
            </div>

            {/* Mətn xüsusiyyətləri */}
            {el.type === 'text' && (
              <>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Mətn ölçüsü</p>
                  <p className="text-sm font-semibold text-slate-700">{el.fontSize}px</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Mətn qalınlığı</p>
                  <p className="text-sm font-semibold text-slate-700">{getFontWeightLabel(el.fontWeight)}</p>
                </div>
                {el.text && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Mətn</p>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg max-h-20 overflow-y-auto whitespace-pre-wrap break-words">
                      {el.text}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
