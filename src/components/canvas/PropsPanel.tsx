import React, { useState, useEffect, useRef } from 'react'
import { Menu } from 'lucide-react'
import { useCanvasStore } from '@/store/canvasStore'
import { Modal } from '@/components/ui/Modal'
import { measureText } from './TextEditor'
import { useI18n } from '@/i18n/I18nContext'

const STROKE_WIDTHS  = [1, 2, 3, 4, 6]
const PRESET_COLORS  = [
  '#1e1e1e', '#ffffff', '#F97316', '#3B82F6',
  '#10B981', '#EF4444', '#8B5CF6', '#F59E0B',
]

const dict: Record<'az' | 'tr' | 'ru' | 'en', {
  hasSelection: (count: number) => string
  toolProps: string
  strokeColor: string
  fillColor: string
  strokeWidth: string
  handEffect: string
  opacity: (val: number) => string
  textSize: (val: number) => string
  textWeight: string
  chooseHex: string
  selectedColor: string
  transparent: string
  palette: string
  apply: string
}> = {
  az: {
    hasSelection: (count: number) => `${count} element seçildi`,
    toolProps: 'Alət xüsusiyyətləri',
    strokeColor: 'Xətt rəngi',
    fillColor: 'Doldurma rəngi',
    strokeWidth: 'Xətt qalınlığı',
    handEffect: 'El çizimi effekti',
    opacity: (val: number) => `Şəffaflıq — ${val}%`,
    textSize: (val: number) => `Mətn ölçüsü — ${val}px`,
    textWeight: 'Mətn qalınlığı',
    chooseHex: 'HEX Rəng Seç',
    selectedColor: 'Seçilmiş rəng',
    transparent: 'Şəffaf',
    palette: 'Palitra:',
    apply: 'Tətbiq et',
  },
  tr: {
    hasSelection: (count: number) => `${count} öğe seçildi`,
    toolProps: 'Araç özellikleri',
    strokeColor: 'Çizgi rengi',
    fillColor: 'Dolgu rengi',
    strokeWidth: 'Çizgi kalınlığı',
    handEffect: 'El çizimi efekti',
    opacity: (val: number) => `Opaklık — %${val}`,
    textSize: (val: number) => `Metin boyutu — ${val}px`,
    textWeight: 'Metin kalınlığı',
    chooseHex: 'HEX Renk Seç',
    selectedColor: 'Seçilen renk',
    transparent: 'Şeffaf',
    palette: 'Palet:',
    apply: 'Uygula',
  },
  ru: {
    hasSelection: (count: number) => `Выбрано элементов: ${count}`,
    toolProps: 'Свойства инструмента',
    strokeColor: 'Цвет линии',
    fillColor: 'Цвет заливки',
    strokeWidth: 'Толщина линии',
    handEffect: 'Эффект эскиза',
    opacity: (val: number) => `Прозрачность — ${val}%`,
    textSize: (val: number) => `Размер текста — ${val}px`,
    textWeight: 'Толщина текста',
    chooseHex: 'Выбрать цвет HEX',
    selectedColor: 'Выбранный цвет',
    transparent: 'Прозрачный',
    palette: 'Палитра:',
    apply: 'Применить',
  },
  en: {
    hasSelection: (count: number) => `${count} elements selected`,
    toolProps: 'Tool properties',
    strokeColor: 'Stroke color',
    fillColor: 'Fill color',
    strokeWidth: 'Stroke width',
    handEffect: 'Sloppiness effect',
    opacity: (val: number) => `Opacity — ${val}%`,
    textSize: (val: number) => `Font size — ${val}px`,
    textWeight: 'Font weight',
    chooseHex: 'Choose HEX Color',
    selectedColor: 'Selected color',
    transparent: 'Transparent',
    palette: 'Palette:',
    apply: 'Apply',
  }
}

export function PropsPanel() {
  const store = useCanvasStore()
  const selectedEls = store.elements.filter(e => store.selectedIds.has(e.id))
  const hasSelection = selectedEls.length > 0
  const [isOpen, setIsOpen] = useState(window.innerWidth > 768)
  const { locale } = useI18n()

  const currentDict = dict[locale as 'az' | 'tr' | 'ru' | 'en'] || dict['en']

  const roughnessLabels = (locale === 'az'
    ? ['Hamar', 'Az', 'Orta', 'Çox']
    : locale === 'tr'
    ? ['Pürüzsüz', 'Az', 'Orta', 'Çok']
    : locale === 'ru'
    ? ['Гладкий', 'Низкий', 'Средний', 'Высокий']
    : ['Smooth', 'Low', 'Medium', 'High'])

  const fontWeightOptions = [
    { value: 300, label: locale === 'az' ? 'İncə' : locale === 'tr' ? 'İnce' : locale === 'ru' ? 'Тонкий' : 'Thin' },
    { value: 400, label: locale === 'az' ? 'Normal' : locale === 'tr' ? 'Normal' : locale === 'ru' ? 'Обычный' : 'Normal' },
    { value: 500, label: locale === 'az' ? 'Orta' : locale === 'tr' ? 'Orta' : locale === 'ru' ? 'Средний' : 'Medium' },
    { value: 600, label: locale === 'az' ? 'Yarıqalın' : locale === 'tr' ? 'Yarı kalın' : locale === 'ru' ? 'Полужирный' : 'Semibold' },
    { value: 700, label: locale === 'az' ? 'Qalın' : locale === 'tr' ? 'Kalın' : locale === 'ru' ? 'Жирный' : 'Bold' },
  ] as const

  const ROUGHNESS_VALS = [
    { value: 0, label: roughnessLabels[0] },
    { value: 1, label: roughnessLabels[1] },
    { value: 2, label: roughnessLabels[2] },
    { value: 3, label: roughnessLabels[3] },
  ]

  const showTextProps = store.activeTool === 'text' || selectedEls.some(e => e.type === 'text')

  return (
    <>
      {/* Panel bağlı olduqda görünən floating toggle */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-4 top-1/2 -translate-y-1/2 w-8 h-16
                     bg-white border border-slate-200 rounded-l-xl
                     flex items-center justify-center shadow-lg
                     hover:bg-slate-50 transition-colors z-30"
        >
          <Menu size={16} className="text-slate-500" />
        </button>
      )}

      {/* Mobil overlay fonu */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 bg-black/30 z-40 animate-fade-in"
        />
      )}

      <aside className={`shrink-0 bg-white border-l border-slate-100
                        flex flex-col overflow-hidden z-10
                        relative md:relative h-[calc(100vh-56px)] md:h-[calc(100vh-64px)]
                        max-md:fixed max-md:right-0 max-md:top-0 max-md:h-full max-md:z-50
                        ${isOpen ? 'w-64 max-md:w-72' : 'w-0 md:border-l-0'}`}
              style={{ transition: 'width 0.25s ease' }}>

        <div className={`flex flex-col flex-1 min-h-0 overflow-y-auto ${isOpen ? 'opacity-100' : 'opacity-0 invisible'}`}>
          <div className="p-3 border-b border-slate-100 bg-slate-50/20 shrink-0 flex items-center justify-between gap-2">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
              {hasSelection ? currentDict.hasSelection(selectedEls.length) : currentDict.toolProps}
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
            >
              <Menu size={14} />
            </button>
          </div>

        <div className="p-4 space-y-5">
        {/* Stroke rəngi */}
        <Section title={currentDict.strokeColor}>
          <ColorPicker
            value={store.strokeColor}
            onChange={store.setStrokeColor}
            onElementUpdate={c => store.selectedIds.size > 0 &&
              store.updateElements(Array.from(store.selectedIds), { strokeColor: c })}
          />
        </Section>

        {/* Fill rəngi */}
        <Section title={currentDict.fillColor}>
          <ColorPicker
            value={store.fillColor}
            onChange={store.setFillColor}
            showTransparent
            onElementUpdate={c => store.selectedIds.size > 0 &&
              store.updateElements(Array.from(store.selectedIds), { fillColor: c })}
          />
        </Section>

        {/* Xətt qalınlığı */}
        <Section title={currentDict.strokeWidth}>
          <div className="flex gap-2">
            {STROKE_WIDTHS.map(w => (
              <button
                key={w}
                onClick={() => {
                  store.setStrokeWidth(w)
                  if (store.selectedIds.size > 0)
                    store.updateElements(Array.from(store.selectedIds), { strokeWidth: w })
                }}
                className={`flex-1 h-9 rounded-lg flex items-center justify-center
                            border-2 transition-colors active:scale-95 ${
                  store.strokeWidth === w
                    ? 'border-orange-500 bg-orange-50/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div
                  className="bg-slate-700 rounded-full"
                  style={{ width: `${w * 3 + 4}px`, height: `${w}px` }}
                />
              </button>
            ))}
          </div>
        </Section>

        {/* El çizimi səviyyəsi */}
        <Section title={currentDict.handEffect}>
          <div className="grid grid-cols-2 gap-2">
            {ROUGHNESS_VALS.map(r => (
              <button
                key={r.value}
                onClick={() => {
                  store.setRoughness(r.value)
                  if (store.selectedIds.size > 0)
                    store.updateElements(Array.from(store.selectedIds), { roughness: r.value })
                }}
                className={`py-2 px-3 rounded-xl text-xs font-semibold
                            border-2 transition-colors active:scale-95 ${
                  store.roughness === r.value
                    ? 'border-orange-500 bg-orange-50/50 text-orange-600 font-bold'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </Section>

        {/* Şəffaflıq */}
        <Section title={currentDict.opacity(store.opacity)}>
          <input
            type="range"
            min={10} max={100} step={5}
            value={store.opacity}
            onChange={e => {
              const v = Number(e.target.value)
              store.setOpacity(v)
              if (store.selectedIds.size > 0)
                store.updateElements(Array.from(store.selectedIds), { opacity: v })
            }}
            className="w-full accent-orange-500 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
          />
        </Section>

        {/* Text Properties (Yalnız Text aləti və ya seçili text varsa görünür) */}
        {showTextProps && (
          <>
          <Section title={currentDict.textSize(store.fontSize)}>
            <input
              type="range"
              min={12} max={100} step={2}
              value={store.fontSize}
              onChange={e => {
                const v = Number(e.target.value)
                store.setFontSize(v)
                if (store.selectedIds.size > 0) {
                  const txtIds = Array.from(store.selectedIds).filter(id => store.elements.find(el => el.id === id)?.type === 'text')
                  txtIds.forEach(id => {
                    const el = store.elements.find(el => el.id === id)
                    if (el && el.text) {
                      const m = measureText(el.text, v, el.fontFamily ?? 'hand', el.fontWeight ?? 400)
                      store.updateElement(id, { fontSize: v, width: m.width, height: m.height })
                    } else {
                      store.updateElement(id, { fontSize: v })
                    }
                  })
                }
              }}
              className="w-full accent-orange-500 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
            />
          </Section>

          <Section title={currentDict.textWeight}>
            <div className="flex gap-1.5">
              {fontWeightOptions.map(fw => (
                <button
                  key={fw.value}
                  onClick={() => {
                    store.setFontWeight(fw.value)
                    if (store.selectedIds.size > 0) {
                      const txtIds = Array.from(store.selectedIds).filter(id => store.elements.find(el => el.id === id)?.type === 'text')
                      txtIds.forEach(id => {
                        const el = store.elements.find(el => el.id === id)
                        if (el && el.text) {
                          const m = measureText(el.text, el.fontSize ?? 20, el.fontFamily ?? 'hand', fw.value)
                          store.updateElement(id, { fontWeight: fw.value, width: m.width, height: m.height })
                        } else {
                          store.updateElement(id, { fontWeight: fw.value })
                        }
                      })
                    }
                  }}
                  className={`flex-1 py-2 px-1 rounded-xl text-[10px] font-semibold
                              border-2 transition-colors active:scale-95 leading-tight text-center ${
                    store.fontWeight === fw.value
                      ? 'border-orange-500 bg-orange-50/50 text-orange-600 font-bold'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                  style={{ fontWeight: fw.value }}
                >
                  {fw.label}
                </button>
              ))}
            </div>
          </Section>
          </>
        )}

      </div>
      </div>
    </aside>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2.5">
        {title}
      </p>
      {children}
    </div>
  )
}

interface ColorPickerProps {
  value:           string
  onChange:        (c: string) => void
  onElementUpdate: (c: string) => void
  showTransparent?: boolean
}

function ColorPicker({ value, onChange, onElementUpdate, showTransparent }: ColorPickerProps) {
  const { locale } = useI18n()
  const currentDict = dict[locale] || dict['en']

  const allColors = showTransparent ? ['transparent', ...PRESET_COLORS] : PRESET_COLORS

  const [hexInput, setHexInput] = useState(value === 'transparent' ? '' : value)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const colorPickerRef = useRef<HTMLInputElement>(null)
  const hexRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (value !== 'transparent') {
      setHexInput(value)
    } else {
      setHexInput('')
    }
  }, [value])

  const applyColor = (c: string) => {
    onChange(c)
    onElementUpdate(c)
    if (c !== 'transparent') setHexInput(c)
    else setHexInput('')
  }

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setHexInput(val)
    if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) {
      onChange(val)
      onElementUpdate(val)
    }
  }

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const c = e.target.value
    setHexInput(c)
    onChange(c)
    onElementUpdate(c)
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {allColors.map(c => (
          <button
            key={c}
            onClick={() => applyColor(c)}
            className={`w-7 h-7 rounded-lg border-2 transition-all ${
              value === c ? 'border-orange-500 scale-110 shadow-md shadow-orange-100' : 'border-transparent hover:scale-105'
            }`}
            style={{
              backgroundColor: c === 'transparent' ? undefined : c,
              backgroundImage: c === 'transparent'
                ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, #fff 25%, #fff 75%, #ccc 75%)'
                : undefined,
              backgroundSize: '8px 8px',
            }}
          />
        ))}
        {/* + düyməsi — həmişə sadə, Modal açır */}
        <button
          onClick={() => { setIsModalOpen(true); setHexInput(value === 'transparent' ? '#1e1e1e' : value) }}
          className="w-7 h-7 rounded-lg border-2 border-dashed border-slate-300
                     hover:border-orange-400 flex items-center justify-center
                     text-slate-800 text-lg transition-colors bg-white"
        >
          +
        </button>

        {/* Seçilmiş custom rəng bloku (yalnız dəyişdiriləndə görünür) */}
        {value !== 'transparent' && !PRESET_COLORS.includes(value) && (
          <button
            onClick={() => { setIsModalOpen(true); setHexInput(value) }}
            className="w-7 h-7 rounded-lg border-2 border-slate-200 hover:border-orange-400 transition-all hover:scale-105"
            style={{ backgroundColor: value }}
          />
        )}
      </div>

      {/* HEX Modalı */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentDict.chooseHex} size="sm">
        <div className="flex flex-col gap-4">
          {/* Rəng önizləmə */}
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl border-2 border-slate-200 shadow-inner flex-shrink-0"
              style={{
                backgroundColor: hexInput && /^#([0-9A-F]{3}){1,2}$/i.test(hexInput) ? hexInput : '#ffffff',
                backgroundImage: hexInput === '' || value === 'transparent'
                  ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, #fff 25%, #fff 75%, #ccc 75%)'
                  : undefined,
                backgroundSize: '8px 8px',
              }}
            />
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">{currentDict.selectedColor}</span>
              <span className="text-xs font-semibold text-slate-700">{hexInput || currentDict.transparent}</span>
            </div>
          </div>

          {/* HEX input */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 flex-shrink-0">HEX:</span>
            <input
              ref={hexRef}
              type="text"
              value={hexInput}
              onChange={handleHexChange}
              onKeyDown={e => {
                if (e.key === 'Enter' && /^#([0-9A-F]{3}){1,2}$/i.test(hexInput)) {
                  setIsModalOpen(false)
                }
              }}
              placeholder="#000000"
              spellCheck={false}
              autoFocus
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-orange-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Brauzer rəng seçici */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 flex-shrink-0">{currentDict.palette}</span>
            <input
              ref={colorPickerRef}
              type="color"
              value={hexInput && /^#([0-9A-F]{3}){1,2}$/i.test(hexInput) ? hexInput : '#ffffff'}
              onChange={handleColorPickerChange}
              className="w-full h-10 rounded-lg cursor-pointer border border-slate-200"
            />
          </div>

          {/* Tətbiq et düyməsi */}
          <button
            onClick={() => setIsModalOpen(false)}
            className="w-full py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl
                       hover:bg-orange-600 transition-colors active:scale-95"
          >
            {currentDict.apply}
          </button>
        </div>
      </Modal>
    </>
  )
}
