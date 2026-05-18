import { useEffect } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  message: string
  type: ToastType
  onClose: () => void
  duration?: number
}

export function Toast({
  message,
  type,
  onClose,
  duration = 3000
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  const icons = {
    success: <CheckCircle2 size={16} className="text-emerald-500" />,
    error: <AlertCircle size={16} className="text-red-500" />,
    info: <Info size={16} className="text-blue-500" />,
  }

  const borderColors = {
    success: 'border-emerald-100 bg-emerald-50/50 text-slate-800',
    error: 'border-red-100 bg-red-50/50 text-slate-800',
    info: 'border-blue-100 bg-blue-50/50 text-slate-800',
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 bg-white border rounded-2xl shadow-xl animate-slide-up ${borderColors[type]}`}>
      {icons[type]}
      <span className="text-xs font-semibold">{message}</span>
      <button 
        onClick={onClose} 
        className="text-slate-400 hover:text-slate-600 transition-colors ml-2"
      >
        <X size={14} />
      </button>
    </div>
  )
}
