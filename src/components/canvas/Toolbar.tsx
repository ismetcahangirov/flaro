import React from 'react'
import {
  MousePointer2, Hand, Square, Circle,
  Diamond, Minus, ArrowRight, Type,
  Pencil, Eraser,
} from 'lucide-react'
import { useCanvasStore } from '@/store/canvasStore'
import { Tooltip } from '@/components/ui/Tooltip'
import { useI18n } from '@/i18n/I18nContext'
import type { ToolType } from '@/types/canvas.types'

interface ToolConfig {
  type: ToolType
  icon: React.ReactNode
  shortcut: string
}

const TOOLS: (ToolConfig | 'separator')[] = [
  { type: 'select', icon: <MousePointer2 size={15} />, shortcut: 'V' },
  { type: 'hand', icon: <Hand size={15} />, shortcut: 'H' },
  'separator',
  { type: 'rectangle', icon: <Square size={15} />, shortcut: 'R' },
  { type: 'ellipse', icon: <Circle size={15} />, shortcut: 'O' },
  { type: 'diamond', icon: <Diamond size={15} />, shortcut: 'D' },
  'separator',
  { type: 'line', icon: <Minus size={15} />, shortcut: 'L' },
  { type: 'arrow', icon: <ArrowRight size={15} />, shortcut: 'A' },
  'separator',
  { type: 'text', icon: <Type size={15} />, shortcut: 'T' },
  { type: 'freedraw', icon: <Pencil size={15} />, shortcut: 'P' },
  { type: 'eraser', icon: <Eraser size={15} />, shortcut: 'E' },
]

const getToolLabel = (type: ToolType, locale: string) => {
  const dictionary: Record<ToolType, Record<string, string>> = {
    select: {
      az: 'Seç',
      tr: 'Seç',
      ru: 'Выбрать',
      en: 'Select'
    },
    hand: {
      az: 'Sürüşdür',
      tr: 'Kaydır',
      ru: 'Рука',
      en: 'Hand'
    },
    rectangle: {
      az: 'Düzbucaqlı',
      tr: 'Dikdörtgen',
      ru: 'Прямоугольник',
      en: 'Rectangle'
    },
    ellipse: {
      az: 'Ellips',
      tr: 'Elips',
      ru: 'Эллипс',
      en: 'Ellipse'
    },
    diamond: {
      az: 'Romb',
      tr: 'Elmas',
      ru: 'Ромб',
      en: 'Diamond'
    },
    line: {
      az: 'Xətt',
      tr: 'Çizgi',
      ru: 'Линия',
      en: 'Line'
    },
    arrow: {
      az: 'Ok',
      tr: 'Ok',
      ru: 'Стрелка',
      en: 'Arrow'
    },
    text: {
      az: 'Mətn',
      tr: 'Metin',
      ru: 'Текст',
      en: 'Text'
    },
    freedraw: {
      az: 'Qaralama',
      tr: 'Karalama',
      ru: 'Рисование',
      en: 'Draw'
    },
    image: {
      az: 'Şəkil',
      tr: 'Resim',
      ru: 'Изображение',
      en: 'Image'
    },
    eraser: {
      az: 'Silgi',
      tr: 'Silgi',
      ru: 'Ластик',
      en: 'Eraser'
    }
  }
  return dictionary[type]?.[locale] || dictionary[type]?.['en'] || ''
}

export function Toolbar() {
  const { activeTool, setTool } = useCanvasStore()
  const { locale } = useI18n()

  return (
    <div className="z-20 bg-white rounded-xl md:rounded-2xl shadow-lg border border-slate-100
                    flex flex-row md:flex-col gap-0.5 animate-fade-in
                    fixed bottom-3 md:left-4 left-1/2 -translate-x-1/2
                    md:top-1/2 md:-translate-y-1/2 md:bottom-auto md:translate-x-0
                    p-1 md:p-1.5 w-[calc(100vw-2rem)] md:w-auto overflow-x-auto
                    [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {TOOLS.map((tool, i) => {
        if (tool === 'separator') {
          return (
            <div key={`sep-${i}`}
              className="mx-1 md:mx-1 md:my-1 border-l md:border-l-0 md:border-t border-slate-100 my-0 md:my-1" />
          )
        }

        const isActive = activeTool === tool.type
        const label = getToolLabel(tool.type, locale)

        return (
          <Tooltip
            key={tool.type}
            content={`${label} (${tool.shortcut})`}
            side="right"
          >
            <button
              onClick={() => setTool(tool.type)}
              className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center
                          transition-all active:scale-95 flex-shrink-0 ${isActive
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
            >
              {tool.icon}
            </button>
          </Tooltip>
        )
      })}
    </div>
  )
}
