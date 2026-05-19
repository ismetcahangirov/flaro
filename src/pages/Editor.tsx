import { useEffect, useRef, useState } from 'react'
import { useParams }          from 'react-router-dom'
import { useCanvas }          from '@/hooks/useCanvas'
import { useScene }           from '@/hooks/useScene'
import { useCollaboration }   from '@/hooks/useCollaboration'
import { useCanvasStore }   from '@/store/canvasStore'
import { useAuth }            from '@/hooks/useAuth'
import { Toolbar }            from '@/components/canvas/Toolbar'
import { TopBar }             from '@/components/canvas/TopBar'
import { PropsPanel }         from '@/components/canvas/PropsPanel'
import { ZoomControls }       from '@/components/canvas/ZoomControls'
import { CursorOverlay }      from '@/components/collaboration/CursorOverlay'
import { CommentsLayer }      from '@/components/collaboration/Comments'
import { ActiveUsers }        from '@/components/collaboration/ActiveUsers'
import { ShareModal }         from '@/components/collaboration/ShareModal'
import { AIPanel }            from '@/components/canvas/AIPanel'
import { TextEditor }         from '@/components/canvas/TextEditor'
import type { Scene }         from '@/types/database.types'

export default function Editor() {
  const { sceneId } = useParams<{ sceneId: string }>()
  const canvasRef   = useRef<HTMLCanvasElement>(null)

  const { loadScene, saveScene, isSaving, lastSaved, scene, scheduleAutoSave } = useScene(sceneId)
  const { isPro }    = useAuth()
  const { toCanvas } = useCanvas(canvasRef)
  const collab       = useCollaboration(sceneId ?? '')

  const [showShareModal, setShowShareModal] = useState(false)
  const [localScene, setLocalScene]         = useState<Scene | null>(null)

  const loadSceneRef = useRef(loadScene)
  loadSceneRef.current = loadScene

  // Scene-i yüklə — yalnız sceneId dəyişdikdə
  useEffect(() => {
    if (sceneId) loadSceneRef.current(sceneId)
  }, [sceneId]) // eslint-disable-line react-hooks/exhaustive-deps

  // scene yükləndikdə localScene-i yenilə
  useEffect(() => {
    if (scene) setLocalScene(scene)
  }, [scene])

  // Canvas dəyişikliklərini izlə və autosave planlaşdır
  useEffect(() => {
    return useCanvasStore.subscribe(
      (state) => state.changeCounter,
      () => {
        const { isDirty } = useCanvasStore.getState()
        if (isDirty) scheduleAutoSave()
      }
    )
  }, [scheduleAutoSave])

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handler = () => saveScene(true)
    window.addEventListener('flaro:save', handler)
    return () => window.removeEventListener('flaro:save', handler)
  }, [saveScene])

  // Cursor hərəkətini broadcast et
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseMove  = (e: MouseEvent) => {
      const pt = toCanvas(e.clientX, e.clientY)
      collab.broadcastCursor(pt)
    }
    const handleMouseLeave = () => collab.broadcastCursor(null)

    canvas.addEventListener('mousemove',  handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      canvas.removeEventListener('mousemove',  handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [toCanvas, collab])

  // activeUsers as array for TopBar prop
  const activeUsersArr = Array.from(collab.activeUsers.values())

  return (
    <div className="fixed inset-0 bg-slate-50 overflow-hidden flex flex-col font-sans text-slate-800">
      {/* Yuxarı panel */}
      <TopBar
        sceneId={sceneId ?? ''}
        isSaving={isSaving}
        lastSaved={lastSaved}
        onSave={() => saveScene(true)}
        activeUsers={activeUsersArr}
        onShare={() => setShowShareModal(true)}
        collabSlot={<ActiveUsers />}
      />

      {/* Əsas sahə */}
      <div className="flex-1 flex relative">
        {/* Sol toolbar */}
        <Toolbar />

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <canvas
            id="main-canvas"
            ref={canvasRef}
            className="absolute inset-0 cursor-crosshair"
            style={{ touchAction: 'none' }}
          />

          {/* Cursor overlay (realtime) */}
          <CursorOverlay />

          {/* Comments layer (Pro only) */}
          {isPro && sceneId && <CommentsLayer sceneId={sceneId} />}

          {/* Text Editor overlay */}
          <TextEditor />
        </div>

        {/* Sağ panel */}
        <PropsPanel />
      </div>

      {/* Zoom idarəetməsi */}
      <ZoomControls />

      {/* AI panel (floating, Pro only) */}
      {isPro && <AIPanel />}

      {/* Share modalı */}
      {showShareModal && localScene && (
        <ShareModal
          scene={localScene}
          onClose={() => setShowShareModal(false)}
          onUpdate={(updates) => setLocalScene(prev => prev ? { ...prev, ...updates } : prev)}
        />
      )}
    </div>
  )
}
