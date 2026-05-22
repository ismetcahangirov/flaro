import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: number | string | undefined
  icon: LucideIcon
  loading: boolean
  color?: string
}

export function StatsCard({ title, value, icon: Icon, loading, color = 'orange' }: StatsCardProps) {
  const colorMap: Record<string, { text: string; iconBg: string }> = {
    orange: { text: 'text-orange-600', iconBg: 'bg-orange-50' },
    green: { text: 'text-green-600', iconBg: 'bg-green-50' },
    blue: { text: 'text-blue-600', iconBg: 'bg-blue-50' },
    purple: { text: 'text-purple-600', iconBg: 'bg-purple-50' },
    indigo: { text: 'text-indigo-600', iconBg: 'bg-indigo-50' },
    rose: { text: 'text-rose-600', iconBg: 'bg-rose-50' },
    amber: { text: 'text-amber-600', iconBg: 'bg-amber-50' },
  }

  const theme = colorMap[color] || colorMap.orange

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/85 flex items-center justify-between transition-all hover:shadow-md">
      <div className="space-y-1.5">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          {title}
        </span>
        {loading ? (
          <div className="h-8 w-20 bg-slate-100 animate-pulse rounded-lg mt-1" />
        ) : (
          <span className="text-3xl font-extrabold text-slate-900 block leading-none">
            {value ?? 0}
          </span>
        )}
      </div>
      <div className={`p-3.5 rounded-2xl ${theme.iconBg} ${theme.text} transition-transform group-hover:scale-110`}>
        <Icon size={24} strokeWidth={2.2} />
      </div>
    </div>
  )
}
