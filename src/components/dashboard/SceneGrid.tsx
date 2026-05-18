import { FileQuestion, Clock, Trash2 } from 'lucide-react'
import { SceneCard } from './SceneCard'
import type { Scene } from '@/types/database.types'

interface SceneGridProps {
  scenes:      Scene[]
  isLoading:   boolean
  viewMode:    'grid' | 'list'
  onOpen:      (id: string) => void
  onDelete:    (id: string) => void
  onRename:    (id: string, title: string) => void
  onDuplicate: (id: string) => void
}

export function SceneGrid({
  scenes,
  isLoading,
  viewMode,
  onOpen,
  onDelete,
  onRename,
  onDuplicate
}: SceneGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-pulse-soft">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-slate-100/80 rounded-2xl h-56" />
        ))}
      </div>
    )
  }

  if (scenes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
          <FileQuestion size={32} strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Heç bir səhnə tapılmadı</h3>
        <p className="text-sm text-slate-500 max-w-sm">Yeni bir səhnə yaradaraq fikirlərinizi çəkməyə başlayın.</p>
      </div>
    )
  }

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider pl-6">Səhnə Adı</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Son Redaktə</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right pr-6">Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scenes.map(scene => (
                <tr 
                  key={scene.id}
                  onClick={() => onOpen(scene.id)}
                  className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                >
                  <td className="p-4 pl-6 font-semibold text-slate-800 text-sm truncate max-w-xs">{scene.title}</td>
                  <td className="p-4 text-slate-500 text-xs">{new Date(scene.updated_at).toLocaleDateString('az')}</td>
                  <td className="p-4 text-right pr-6" onClick={e => e.stopPropagation()}>
                    <div className="inline-flex gap-2">
                      <button 
                        onClick={() => onDuplicate(scene.id)}
                        className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-all"
                        title="Kopyala"
                      >
                        <Clock size={14} />
                      </button>
                      <button 
                        onClick={() => onDelete(scene.id)}
                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-all"
                        title="Sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {scenes.map(scene => (
        <SceneCard
          key={scene.id}
          scene={scene}
          onOpen={() => onOpen(scene.id)}
          onDelete={() => onDelete(scene.id)}
          onRename={title => onRename(scene.id, title)}
          onDuplicate={() => onDuplicate(scene.id)}
        />
      ))}
    </div>
  )
}
