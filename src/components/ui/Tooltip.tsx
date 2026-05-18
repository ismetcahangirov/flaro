import React, { useState, useRef } from 'react'

interface TooltipProps {
  content:  string
  children: React.ReactElement
  side?:    'top' | 'right' | 'bottom' | 'left'
  delay?:   number
}

export function Tooltip({
  content, children, side = 'top', delay = 500
}: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = () => {
    timerRef.current = setTimeout(() => setVisible(true), delay)
  }

  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setVisible(false)
  }

  const positions = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {visible && (
        <div className={`absolute ${positions[side]} z-50 pointer-events-none animate-fade-in`}>
          <div className="bg-slate-900 text-white text-xs font-semibold px-2.5 py-1.5
                          rounded-lg whitespace-nowrap shadow-lg">
            {content}
          </div>
        </div>
      )}
    </div>
  )
}
