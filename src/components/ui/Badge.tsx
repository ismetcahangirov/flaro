import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'orange' | 'slate' | 'green' | 'blue' | 'red'
}

export function Badge({ children, variant = 'orange' }: BadgeProps) {
  const styles = {
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 border rounded-full text-xs font-semibold uppercase tracking-wider ${styles[variant]}`}>
      {children}
    </span>
  )
}
