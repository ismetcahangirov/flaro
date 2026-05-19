import React from 'react'
import {
  MousePointer2, Hand, Square, Circle,
  Diamond, Minus, ArrowRight, Type,
  Pencil, Eraser,
} from 'lucide-react'
import { useCanvasStore } from '@/store/canvasStore'
import { Tooltip } from '@/components/ui/Tooltip'
import type { ToolType } from '@/types/canvas.types'

interface ToolConfig {
  type: ToolType
  icon: React.ReactNode
  label: string
  shortcut: string
}

const TOOLS: (ToolConfig | 'separator')[] = [
  { type: 'select', icon: <MousePointer2 size={15} />, label: 'Seç', shortcut: 'V' },
  { type: 'hand', icon: <Hand size={15} />, label: 'Sürüşdür', shortcut: 'H' },
  'separator',
  { type: 'rectangle', icon: <Square size={15} />, label: 'Düzbucaqlı', shortcut: 'R' },
  { type: 'ellipse', icon: <Circle size={15} />, label: 'Ellips', shortcut: 'O' },
  { type: 'diamond', icon: <Diamond size={15} />, label: 'Romb', shortcut: 'D' },
  'separator',
  { type: 'line', icon: <Minus size={15} />, label: 'Xətt', shortcut: 'L' },
  { type: 'arrow', icon: <ArrowRight size={15} />, label: 'Ok', shortcut: 'A' },
  'separator',
  { type: 'text', icon: <Type size={15} />, label: 'Mətn', shortcut: 'T' },
  { type: 'freedraw', icon: <Pencil size={15} />, label: 'Qaralama', shortcut: 'P' },
  { type: 'eraser', icon: <Eraser size={15} />, label: 'Silgi', shortcut: 'E' },
]

export function Toolbar() {
  const { activeTool, setTool } = useCanvasStore()

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

        return (
          <Tooltip
            key={tool.type}
            content={`${tool.label} (${tool.shortcut})`}
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
