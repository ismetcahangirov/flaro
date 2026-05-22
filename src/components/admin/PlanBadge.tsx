import { Shield, User } from 'lucide-react'
import type { SubscriptionPlan } from '@/types/database.types'

interface PlanBadgeProps {
  plan: SubscriptionPlan | string
}

export function PlanBadge({ plan }: PlanBadgeProps) {
  const isPro = plan === 'pro'

  if (isPro) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
        <Shield size={12} className="stroke-[2.5]" />
        <span>PRO</span>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200/80">
      <User size={12} className="stroke-[2.5] opacity-70" />
      <span>FREE</span>
    </span>
  )
}
