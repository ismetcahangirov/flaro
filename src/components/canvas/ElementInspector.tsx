import { useState } from 'react'
import { X, Info } from 'lucide-react'
import { useCanvasStore } from '@/store/canvasStore'
import { useI18n } from '@/i18n/I18nContext'

const getFontWeightLabel = (weight?: number, locale?: string) => {
  const isAz = locale === 'az'
  const isTr = locale === 'tr'
  const isRu = locale === 'ru'
  switch (weight) {
    case 300: return isAz ? 'İncə (300)' : isTr ? 'İnce (300)' : isRu ? 'Тонкий (300)' : 'Thin (300)'
    case 500: return isAz ? 'Orta (500)' : isTr ? 'Orta (500)' : isRu ? 'Средний (500)' : 'Medium (500)'
    case 600: return isAz ? 'Yarıqalın (600)' : isTr ? 'Yarı kalın (600)' : isRu ? 'Полужирный (600)' : 'Semibold (600)'
    case 700: return isAz ? 'Qalın (700)' : isTr ? 'Kalın (700)' : isRu ? 'Жирный (700)' : 'Bold (700)'
    case 400:
    default: return isAz ? 'Normal (400)' : isTr ? 'Normal (400)' : isRu ? 'Обычный (400)' : 'Normal (400)'
  }
}

const getElementTypeLabel = (type: string, locale: string) => {
  const labels: Record<string, Record<string, string>> = {
    select: { az: 'Seçim', tr: 'Seçim', ru: 'Выбор', en: 'Select' },
    hand: { az: 'Sürüşdür', tr: 'Kaydır', ru: 'Рука', en: 'Hand' },
    rectangle: { az: 'Düzbucaqlı', tr: 'Dikdörtgen', ru: 'Прямоугольник', en: 'Rectangle' },
    ellipse: { az: 'Ellips', tr: 'Elips', ru: 'Эллипс', en: 'Ellipse' },
    diamond: { az: 'Romb', tr: 'Elmas', ru: 'Ромб', en: 'Diamond' },
    line: { az: 'Xətt', tr: 'Çizgi', ru: 'Линия', en: 'Line' },
    arrow: { az: 'Ok', tr: 'Ok', ru: 'Стрелка', en: 'Arrow' },
    text: { az: 'Mətn', tr: 'Metin', ru: 'Текст', en: 'Text' },
    freedraw: { az: 'Qaralama', tr: 'Karalama', ru: 'Рисование', en: 'Draw' },
  }
  return labels[type]?.[locale] || labels[type]?.['en'] || type
}

const dict: Record<'az' | 'tr' | 'ru' | 'en', {
  selectElement: string
  clickElementDesc: string
  hasSelection: (count: number) => string
  elementProps: string
  type: string
  dimensions: string
  angle: string
  strokeColor: string
  fillColor: string
  strokeWidth: string
  handEffect: string
  opacity: string
  textSize: string
  textWeight: string
  text: string
  smooth: string
  low: string
  medium: string
  high: string
}> = {
  az: {
    selectElement: 'Element Seçin',
    clickElementDesc: 'Xüsusiyyətləri görmək üçün bir elementə klikləyin',
    hasSelection: (count: number) => `${count} element seçildi`,
    elementProps: 'Element Xüsusiyyətləri',
    type: 'Tip',
    dimensions: 'Ölçülər',
    angle: 'Bucaq',
    strokeColor: 'Xətt rəngi',
    fillColor: 'Doldurma rəngi',
    strokeWidth: 'Xətt qalınlığı',
    handEffect: 'El çizimi effekti',
    opacity: 'Şəffaflıq',
    textSize: 'Mətn ölçüsü',
    textWeight: 'Mətn qalınlığı',
    text: 'Mətn',
    smooth: 'Hamar',
    low: 'Az',
    medium: 'Orta',
    high: 'Çox'
  },
  tr: {
    selectElement: 'Öğe Seçin',
    clickElementDesc: 'Özellikleri görmek için bir öğeye tıklayın',
    hasSelection: (count: number) => `${count} öğe seçildi`,
    elementProps: 'Öğe Özellikleri',
    type: 'Tip',
    dimensions: 'Boyutlar',
    angle: 'Açı',
    strokeColor: 'Çizgi rengi',
    fillColor: 'Dolgu rengi',
    strokeWidth: 'Çizgi kalınlığı',
    handEffect: 'El çizimi efekti',
    opacity: 'Opaklık',
    textSize: 'Metin boyutu',
    textWeight: 'Metin kalınlığı',
    text: 'Metin',
    smooth: 'Pürüzsüz',
    low: 'Az',
    medium: 'Orta',
    high: 'Çok'
  },
  ru: {
    selectElement: 'Выберите элемент',
    clickElementDesc: 'Кликните на элемент, чтобы увидеть его свойства',
    hasSelection: (count: number) => `Выбрано элементов: ${count}`,
    elementProps: 'Свойства элемента',
    type: 'Тип',
    dimensions: 'Размеры',
    angle: 'Угол',
    strokeColor: 'Цвет линии',
    fillColor: 'Цвет заливки',
    strokeWidth: 'Толщина линии',
    handEffect: 'Эффект эскиза',
    opacity: 'Прозрачность',
    textSize: 'Размер текста',
    textWeight: 'Толщина текста',
    text: 'Текст',
    smooth: 'Гладкий',
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий'
  },
  en: {
    selectElement: 'Select Element',
    clickElementDesc: 'Click on an element to inspect its properties',
    hasSelection: (count: number) => `${count} elements selected`,
    elementProps: 'Element Properties',
    type: 'Type',
    dimensions: 'Dimensions',
    angle: 'Angle',
    strokeColor: 'Stroke color',
    fillColor: 'Fill color',
    strokeWidth: 'Stroke width',
    handEffect: 'Sloppiness effect',
    opacity: 'Opacity',
    textSize: 'Font size',
    textWeight: 'Font weight',
    text: 'Text',
    smooth: 'Smooth',
    low: 'Low',
    medium: 'Medium',
    high: 'High'
  }
}

export function ElementInspector() {
  const store = useCanvasStore()
  const selectedEls = store.elements.filter(e => store.selectedIds.has(e.id))
  const [isOpen, setIsOpen] = useState(window.innerWidth > 768)
  const { locale } = useI18n()

  const currentDict = dict[locale as 'az' | 'tr' | 'ru' | 'en'] || dict['en']

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
                {currentDict.selectElement}
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
              {currentDict.clickElementDesc}
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
              {selectedEls.length > 1 ? currentDict.hasSelection(selectedEls.length) : currentDict.elementProps}
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
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{currentDict.type}</p>
              <p className="text-sm font-semibold text-slate-700 capitalize">{getElementTypeLabel(el.type, locale)}</p>
            </div>

            {/* Ölçülər */}
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{currentDict.dimensions}</p>
              <p className="text-sm font-semibold text-slate-700">
                {Math.round(el.width)} x {Math.round(el.height)} px
              </p>
            </div>

            {/* Bucaq */}
            {el.angle !== 0 && (
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{currentDict.angle}</p>
                <p className="text-sm font-semibold text-slate-700">{Math.round((el.angle * 180) / Math.PI)}°</p>
              </div>
            )}

            {/* Xətt rəngi */}
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">{currentDict.strokeColor}</p>
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
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">{currentDict.fillColor}</p>
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
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{currentDict.strokeWidth}</p>
              <p className="text-sm font-semibold text-slate-700">{el.strokeWidth}px</p>
            </div>

            {/* El çizimi */}
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{currentDict.handEffect}</p>
              <p className="text-sm font-semibold text-slate-700">
                {el.roughness === 0 ? currentDict.smooth : el.roughness === 1 ? currentDict.low : el.roughness === 2 ? currentDict.medium : currentDict.high}
              </p>
            </div>

            {/* Şəffaflıq */}
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{currentDict.opacity}</p>
              <p className="text-sm font-semibold text-slate-700">{el.opacity}%</p>
            </div>

            {/* Mətn xüsusiyyətləri */}
            {el.type === 'text' && (
              <>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{currentDict.textSize}</p>
                  <p className="text-sm font-semibold text-slate-700">{el.fontSize}px</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{currentDict.textWeight}</p>
                  <p className="text-sm font-semibold text-slate-700">{getFontWeightLabel(el.fontWeight, locale)}</p>
                </div>
                {el.text && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{currentDict.text}</p>
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
