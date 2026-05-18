import React from 'react'
import {
  MousePointer2, Hand, Square, Circle,
  Diamond, Minus, ArrowRight, Type,
  Pencil, Eraser,
} from 'lucide-react'
import { useCanvasStore } from '@/store/canvasStore'
import { Tooltip }        from '@/components/ui/Tooltip'
import type { ToolType }  from '@/types/canvas.types'

interface ToolConfig {
  type:     ToolType
  icon:     React.ReactNode
  label:    string
  shortcut: string
}

const TOOLS: (ToolConfig | 'separator')[] = [
  { type: 'select',    icon: <MousePointer2 size={18}/>, label: 'Seç',       shortcut: 'V' },
  { type: 'hand',      icon: <Hand          size={18}/>, label: 'Sürüşdür',  shortcut: 'H' },
  'separator',
  { type: 'rectangle', icon: <Square        size={18}/>, label: 'Düzbucaqlı', shortcut: 'R' },
  { type: 'ellipse',   icon: <Circle        size={18}/>, label: 'Ellips',    shortcut: 'O' },
  { type: 'diamond',   icon: <Diamond       size={18}/>, label: 'Romb',      shortcut: 'D' },
  'separator',
  { type: 'line',      icon: <Minus         size={18}/>, label: 'Xətt',      shortcut: 'L' },
  { type: 'arrow',     icon: <ArrowRight    size={18}/>, label: 'Ok',        shortcut: 'A' },
  'separator',
  { type: 'text',      icon: <Type          size={18}/>, label: 'Mətn',      shortcut: 'T' },
  { type: 'freedraw',  icon: <Pencil        size={18}/>, label: 'Qaralama',  shortcut: 'P' },
  { type: 'eraser',    icon: <Eraser        size={18}/>, label: 'Silgi',     shortcut: 'E' },
]

export function Toolbar() {
  const { activeTool, setTool } = useCanvasStore()

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20
                    bg-white rounded-2xl shadow-lg border border-slate-100
                    p-1.5 flex flex-col gap-0.5 animate-fade-in">
      {TOOLS.map((tool, i) => {
        if (tool === 'separator') {
          return (
            <div key={`sep-${i}`}
                 className="my-1 border-t border-slate-100 mx-1" />
          )
        }

        const isActive = activeTool === tool.type

        return (
          <Tooltip
            key={tool.type}
            content={`${tool.label} (${tool.shortcut})`}
            side="right"
          >
            <button
              onClick={() => setTool(tool.type)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center
                          transition-all active:scale-95 ${
                isActive
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
