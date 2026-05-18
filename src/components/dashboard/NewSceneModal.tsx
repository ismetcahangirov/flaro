import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

interface NewSceneModalProps {
  onClose: () => void
  onCreate: (title: string) => void
  canCreate: boolean
}

export function NewSceneModal({ onClose, onCreate, canCreate }: NewSceneModalProps) {
  const [title, setTitle] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !canCreate) return

    setIsLoading(true)
    try {
      await onCreate(title.trim())
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Yeni Səhnə Yarat">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Səhnə Adı</label>
          <input
            type="text"
            required
            placeholder="Məs. Flaro Flowchart"
            value={title}
            onChange={e => setTitle(e.target.value)}
            disabled={isLoading || !canCreate}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:bg-white focus:border-orange-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {!canCreate && (
          <p className="text-xs text-red-500 font-semibold bg-red-50/50 p-3 rounded-xl border border-red-100">
            Free planda maksimum 3 səhnə limiti dolub. Limitsiz səhnələr üçün Pro-ya keçin.
          </p>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="secondary" onClick={onClose} disabled={isLoading} type="button">
            Ləğv et
          </Button>
          <Button 
            variant="primary" 
            type="submit" 
            isLoading={isLoading} 
            disabled={!title.trim() || !canCreate}
          >
            Yarat
          </Button>
        </div>
      </form>
    </Modal>
  )
}
