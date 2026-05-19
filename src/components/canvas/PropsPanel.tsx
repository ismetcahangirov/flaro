import React, { useState, useEffect } from 'react'
import { useCanvasStore } from '@/store/canvasStore'

const STROKE_WIDTHS  = [1, 2, 3, 4, 6]
const ROUGHNESS_VALS = [
  { value: 0, label: 'Hamar'  },
  { value: 1, label: 'Az'     },
  { value: 2, label: 'Orta'   },
  { value: 3, label: 'Çox'    },
]
const PRESET_COLORS  = [
  '#1e1e1e', '#ffffff', '#F97316', '#3B82F6',
  '#10B981', '#EF4444', '#8B5CF6', '#F59E0B',
]

export function PropsPanel() {
  const store = useCanvasStore()
  const selectedEls = store.elements.filter(e => store.selectedIds.has(e.id))
  const hasSelection = selectedEls.length > 0

  return (
    <aside className="w-64 shrink-0 bg-white border-l border-slate-100 md:shadow-lg
                      flex flex-col overflow-y-auto z-10 animate-fade-in transition-transform">
      <div className="p-4 border-b border-slate-100 bg-slate-50/20">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {hasSelection ? `${selectedEls.length} element seçildi` : 'Alət xüsusiyyətləri'}
        </h3>
      </div>

      <div className="p-4 space-y-5">
        {/* Stroke rəngi */}
        <Section title="Xətt rəngi">
          <ColorPicker
            value={store.strokeColor}
            onChange={store.setStrokeColor}
            onElementUpdate={c => store.selectedIds.size > 0 &&
              store.updateElements(Array.from(store.selectedIds), { strokeColor: c })}
          />
        </Section>

        {/* Fill rəngi */}
        <Section title="Doldurma rəngi">
          <ColorPicker
            value={store.fillColor}
            onChange={store.setFillColor}
            showTransparent
            onElementUpdate={c => store.selectedIds.size > 0 &&
              store.updateElements(Array.from(store.selectedIds), { fillColor: c })}
          />
        </Section>

        {/* Xətt qalınlığı */}
        <Section title="Xətt qalınlığı">
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
        <Section title="El çizimi effekti">
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
        <Section title={`Şəffaflıq — ${store.opacity}%`}>
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
      </div>
    </aside>
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
  const allColors = showTransparent ? ['transparent', ...PRESET_COLORS] : PRESET_COLORS
  
  const [hexInput, setHexInput] = useState(value === 'transparent' ? '' : value)

  useEffect(() => {
    if (value !== 'transparent') {
      setHexInput(value)
    } else {
      setHexInput('')
    }
  }, [value])

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value
    setHexInput(val)
    if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) {
      onChange(val)
      onElementUpdate(val)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {allColors.map(c => (
          <button
            key={c}
            onClick={() => { onChange(c); onElementUpdate(c) }}
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
        {/* Custom rəng */}
        <label className="w-7 h-7 rounded-lg border-2 border-dashed border-slate-300
                          hover:border-orange-400 cursor-pointer flex items-center
                          justify-center text-slate-400 text-lg overflow-hidden transition-colors relative">
          +
          <input
            type="color"
            className="absolute opacity-0 w-0 h-0"
            value={value === 'transparent' ? '#ffffff' : value}
            onChange={e => { onChange(e.target.value); onElementUpdate(e.target.value) }}
          />
        </label>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs font-semibold text-slate-400">HEX:</span>
        <input
          type="text"
          value={hexInput}
          onChange={handleHexChange}
          placeholder="#000000"
          spellCheck={false}
          className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-orange-500 focus:bg-white transition-colors"
        />
      </div>
    </div>
  )
}
