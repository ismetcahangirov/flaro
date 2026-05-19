import {
  useRef, useEffect, useCallback
} from 'react'
import rough from 'roughjs'
import { nanoid } from 'nanoid'
import { useCanvasStore, getGroupBoundingBox } from '@/store/canvasStore'
import {
  drawRoughElement,
  drawSelectionBox,
  drawGroupSelectionBox,
  drawLasso,
} from '@/lib/roughCanvas'
import { getElementAtPoint, getElementsInRect, getHandleAtPoint } from '@/lib/hitTest'
import type { HandleType } from '@/lib/hitTest'
import type { CanvasElement, Point, ToolType } from '@/types/canvas.types'

const ZOOM_STEP   = 0.1
const ZOOM_MIN    = 0.1
const ZOOM_MAX    = 30

export function useCanvas(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const store    = useCanvasStore()
  const storeRef = useRef(store)
  useEffect(() => {
    storeRef.current = store
  }, [store])

  const rafRef   = useRef<number>(0)

  // ── Mouse state ───────────────────────────────────────────────────────────
  const isDrawing    = useRef(false)
  const isPanning    = useRef(false)
  const isDragging   = useRef(false)
  const mouseStart   = useRef<Point>({ x: 0, y: 0 })
  const lastMouse    = useRef<Point>({ x: 0, y: 0 })
  const currentElId  = useRef<string | null>(null)
  const lassoStart   = useRef<Point | null>(null)
  const lassoEnd     = useRef<Point | null>(null)
  const spaceDown    = useRef(false)
  const resizingHandle    = useRef<HandleType | null>(null)
  const rotatingElementId = useRef<string | null>(null)
  const resizeInitialBox  = useRef<{x: number, y: number, width: number, height: number} | null>(null)

  // Alignment guide refs
  const showGuideXRef = useRef<boolean>(false)
  const showGuideYRef = useRef<boolean>(false)
  const guideXCoordRef = useRef<number>(0)
  const guideYCoordRef = useRef<number>(0)

  // Group resize/rotate refs
  const isGroupRotating           = useRef(false)
  const isGroupResizing           = useRef(false)
  const groupRotateCenter         = useRef<Point>({ x: 0, y: 0 })
  const groupResizeInitialBox     = useRef<{x: number, y: number, width: number, height: number} | null>(null)
  const groupResizeInitialElements = useRef<CanvasElement[] | null>(null)
  const groupResizeHandle         = useRef<HandleType | null>(null)

  // ── Koordinat çevirmə ─────────────────────────────────────────────────────
  const toCanvas = useCallback((sx: number, sy: number): Point => {
    const canvas = canvasRef.current
    const rect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 }
    const s = storeRef.current
    const { scrollX, scrollY, zoom } = s.appState
    return {
      x: (sx - rect.left - scrollX) / zoom,
      y: (sy - rect.top - scrollY) / zoom,
    }
  }, [canvasRef])

  const toScreen = useCallback((cx: number, cy: number): Point => {
    const canvas = canvasRef.current
    const rect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 }
    const s = storeRef.current
    const { scrollX, scrollY, zoom } = s.appState
    return {
      x: cx * zoom + scrollX + rect.left,
      y: cy * zoom + scrollY + rect.top,
    }
  }, [canvasRef])

  // ── Yeni element yarat ────────────────────────────────────────────────────
  const createElement = useCallback((
    type:  CanvasElement['type'],
    start: Point
  ): CanvasElement => {
    const s = storeRef.current
    const fontSize = s.fontSize ?? 20
    return {
      id:          nanoid(),
      type,
      x:           start.x,
      y:           start.y,
      // Text elementlər üçün başlanğıc ölçü — textarea görünür olsun
      width:       type === 'text' ? 10 : 0,
      height:      type === 'text' ? Math.ceil(fontSize * 1.4) : 0,
      angle:       0,
      strokeColor: s.strokeColor,
      fillColor:   s.fillColor,
      fillStyle:   s.fillStyle,
      strokeWidth: s.strokeWidth,
      strokeStyle: s.strokeStyle,
      roughness:   s.roughness,
      opacity:     s.opacity,
      seed:        Math.floor(Math.random() * 100000),
      version:     1,
      isDeleted:   false,
      points:      type === 'line' || type === 'arrow' || type === 'freedraw'
        ? [{ x: 0, y: 0 }]
        : undefined,
      text:        type === 'text' ? '' : undefined,
      fontSize:    type === 'text' ? fontSize : undefined,
      fontFamily:  type === 'text' ? s.fontFamily : undefined,
      textAlign:   type === 'text' ? 'left' : undefined,
    }
  }, [])

  // ── Mouse Down ───────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button === 1 || spaceDown.current) {
      // Orta düymə və ya Space — pan
      isPanning.current  = true
      lastMouse.current  = { x: e.clientX, y: e.clientY }
      return
    }

    const s = useCanvasStore.getState()
    const canvasPoint = toCanvas(e.clientX, e.clientY)
    mouseStart.current = canvasPoint

    const { activeTool, elements, selectedIds, isReadOnly } = s

    if (isReadOnly && activeTool !== 'hand') return

    switch (activeTool) {
      case 'select': {
        let clickedHandle: HandleType | null = null
        let targetEl: CanvasElement | null = null

        // Çoxlu seçim varsa, əvvəlcə qrup bounding box-un handle-larını yoxla
        if (s.selectedIds.size > 1) {
          const groupBbox = getGroupBoundingBox(elements, s.selectedIds)
          if (groupBbox) {
            const PAD = 8 / s.appState.zoom
            const virtualEl = {
              x: groupBbox.x - PAD, y: groupBbox.y - PAD,
              width: groupBbox.width + PAD * 2, height: groupBbox.height + PAD * 2,
              angle: 0, id: '', type: 'rectangle' as const,
              strokeColor: '', fillColor: '', fillStyle: 'solid' as any,
              strokeWidth: 0, strokeStyle: 'solid' as any,
              opacity: 100, roughness: 0, seed: 0, version: 1, isDeleted: false,
            }
            clickedHandle = getHandleAtPoint(virtualEl, canvasPoint, s.appState.zoom)

            if (clickedHandle) {
              if (clickedHandle === 'rotate') {
                isGroupRotating.current = true
                groupRotateCenter.current = {
                  x: groupBbox.x + groupBbox.width / 2,
                  y: groupBbox.y + groupBbox.height / 2,
                }
                groupResizeInitialElements.current = elements
                  .filter(el => s.selectedIds.has(el.id))
                  .map(el => ({ ...el }))
              } else {
                isGroupResizing.current = true
                groupResizeHandle.current = clickedHandle
                groupResizeInitialBox.current = { ...groupBbox }
                groupResizeInitialElements.current = elements
                  .filter(el => s.selectedIds.has(el.id))
                  .map(el => ({ ...el }))
              }
              mouseStart.current = canvasPoint
              lastMouse.current = canvasPoint
              s.saveHistory()
              return
            }
          }
        }

        // Tək element handle-larını yoxla
        for (const elId of Array.from(s.selectedIds)) {
          const el = elements.find(e => e.id === elId)
          if (el) {
            clickedHandle = getHandleAtPoint(el, canvasPoint, s.appState.zoom)
            if (clickedHandle) {
              targetEl = el
              break
            }
          }
        }

        if (clickedHandle && targetEl) {
          if (clickedHandle === 'rotate') {
            rotatingElementId.current = targetEl.id
          } else {
            resizingHandle.current = clickedHandle
            currentElId.current = targetEl.id
            resizeInitialBox.current = {
              x: targetEl.x,
              y: targetEl.y,
              width: targetEl.width,
              height: targetEl.height
            }
          }
          mouseStart.current = canvasPoint
          lastMouse.current = canvasPoint
          s.saveHistory()
          return
        }

        const hit = getElementAtPoint(elements, canvasPoint, s.appState.zoom)

        if (hit) {
          if (!selectedIds.has(hit.id)) {
            s.selectElement(hit.id, e.shiftKey || e.metaKey)
          }
          isDragging.current = true
          lastMouse.current  = canvasPoint
        } else {
          if (!e.shiftKey) s.clearSelection()
          lassoStart.current = canvasPoint
          lassoEnd.current   = canvasPoint
        }
        break
      }

      case 'hand':
        isPanning.current = true
        lastMouse.current = { x: e.clientX, y: e.clientY }
        break

      case 'eraser': {
        isDrawing.current = true
        const hit = getElementAtPoint(elements, canvasPoint, s.appState.zoom)
        if (hit) {
          s.saveHistory()
          s.deleteElements([hit.id])
        }
        break
      }

      case 'text': {
        e.preventDefault()
        const hit = getElementAtPoint(elements, canvasPoint, s.appState.zoom)
        if (hit?.type === 'text') {
          s.setEditingId(hit.id)
          s.selectElement(hit.id)
        } else {
          const el = createElement('text', canvasPoint)
          s.saveHistory()
          s.addElement(el)
          s.selectElement(el.id)
          s.setEditingId(el.id)
        }
        break
      }

      default: {
        // Shape tool-ları
        const toolToType: Partial<Record<ToolType, CanvasElement['type']>> = {
          rectangle: 'rectangle',
          ellipse:   'ellipse',
          diamond:   'diamond',
          line:      'line',
          arrow:     'arrow',
          freedraw:  'freedraw',
        }

        const elType = toolToType[activeTool]
        if (!elType) break

        isDrawing.current  = true
        const el = createElement(elType, canvasPoint)
        currentElId.current = el.id
        s.saveHistory()
        s.addElement(el)
        s.selectElement(el.id)
      }
    }
  }, [toCanvas, createElement])

  // ── Mouse Move ───────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const s = useCanvasStore.getState()
    const canvasPoint = toCanvas(e.clientX, e.clientY)

    // Pan
    if (isPanning.current) {
      if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing'
      const dx = e.clientX - lastMouse.current.x
      const dy = e.clientY - lastMouse.current.y
      s.setScroll(
        s.appState.scrollX + dx,
        s.appState.scrollY + dy
      )
      lastMouse.current = { x: e.clientX, y: e.clientY }
      return
    }

    // Eraser — davamlı silmə
    if (s.activeTool === 'eraser' && isDrawing.current) {
      const hit = getElementAtPoint(s.elements, canvasPoint, s.appState.zoom)
      if (hit) s.deleteElements([hit.id])
    }

    // Rotate
    if (rotatingElementId.current) {
      if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing'
      const el = s.elements.find(e => e.id === rotatingElementId.current)
      if (el) {
        const cx = el.x + el.width / 2
        const cy = el.y + el.height / 2
        // Calculate angle. -Math.PI/2 because top is 0 rotation
        let angle = Math.atan2(canvasPoint.y - cy, canvasPoint.x - cx) + Math.PI / 2
        
        // Snapping logic
        if (e.shiftKey) {
          // Shift basılanda hər 15 dərəcədən bir tam snap edir
          const degree = (angle * 180) / Math.PI
          const snappedDegree = Math.round(degree / 15) * 15
          angle = (snappedDegree * Math.PI) / 180
        } else {
          // Normal halda əsas bucaqlara (0, 45, 90, 135, 180, 270, 360) 3 dərəcə yaxınlaşanda soft-snap edir
          const degree = (angle * 180) / Math.PI
          const targets = [0, 45, 90, 135, 180, 225, 270, 315, 360, -45, -90, -135, -180, -225, -270, -315, -360]
          for (const target of targets) {
            if (Math.abs(degree - target) < 3) {
              angle = (target * Math.PI) / 180
              break
            }
          }
        }
        
        s.updateElement(el.id, { angle })
      }
      return
    }

    // Group rotate
    if (isGroupRotating.current && groupResizeInitialElements.current) {
      if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing'
      const center = groupRotateCenter.current
      let angle = Math.atan2(canvasPoint.y - center.y, canvasPoint.x - center.x) + Math.PI / 2

      if (e.shiftKey) {
        const degree = (angle * 180) / Math.PI
        angle = (Math.round(degree / 15) * 15 * Math.PI) / 180
      } else {
        const degree = (angle * 180) / Math.PI
        const targets = [0, 45, 90, 135, 180, 225, 270, 315, 360, -45, -90, -135, -180, -225, -270, -315, -360]
        for (const target of targets) {
          if (Math.abs(degree - target) < 3) {
            angle = (target * Math.PI) / 180
            break
          }
        }
      }

      const startAngle = Math.atan2(
        mouseStart.current.y - center.y,
        mouseStart.current.x - center.x
      ) + Math.PI / 2
      const deltaAngle = angle - startAngle

      groupResizeInitialElements.current.forEach(origEl => {
        const elCenterX = origEl.x + origEl.width / 2
        const elCenterY = origEl.y + origEl.height / 2
        const relX = elCenterX - center.x
        const relY = elCenterY - center.y
        const cos = Math.cos(deltaAngle)
        const sin = Math.sin(deltaAngle)
        const newCenterX = center.x + relX * cos - relY * sin
        const newCenterY = center.y + relX * sin + relY * cos
        s.updateElement(origEl.id, {
          x: newCenterX - origEl.width / 2,
          y: newCenterY - origEl.height / 2,
          angle: (origEl.angle || 0) + deltaAngle,
        })
      })
      return
    }

    // Resize
    if (resizingHandle.current && currentElId.current && resizeInitialBox.current) {
      const handle = resizingHandle.current
      if (canvasRef.current) {
        if (['tl', 'br'].includes(handle)) canvasRef.current.style.cursor = 'nwse-resize'
        else if (['tr', 'bl'].includes(handle)) canvasRef.current.style.cursor = 'nesw-resize'
        else if (['tm', 'bm'].includes(handle)) canvasRef.current.style.cursor = 'ns-resize'
        else if (['ml', 'mr'].includes(handle)) canvasRef.current.style.cursor = 'ew-resize'
      }

      const el = s.elements.find(e => e.id === currentElId.current)
      if (el) {
        const dx = canvasPoint.x - mouseStart.current.x
        const dy = canvasPoint.y - mouseStart.current.y
        
        const angle = el.angle || 0
        let localDx = dx * Math.cos(-angle) - dy * Math.sin(-angle)
        let localDy = dx * Math.sin(-angle) + dy * Math.cos(-angle)

        const initial = resizeInitialBox.current

        // Deformasiya olmadan (proportional) resize for corners
        if (['tl', 'tr', 'bl', 'br'].includes(handle)) {
           // Provide a fallback aspect of 1 to avoid NaN if height is 0
           const aspect = initial.height !== 0 ? initial.width / initial.height : 1
           
           const newWidthX = initial.width + (handle.includes('r') ? localDx : -localDx)
           const newHeightY = initial.height + (handle.includes('b') ? localDy : -localDy)
           
           if (Math.abs(newWidthX) > Math.abs(newHeightY * aspect)) {
               // X is dominant
               const expectedHeight = newWidthX / aspect
               localDy = (handle.includes('b') ? 1 : -1) * (expectedHeight - initial.height)
           } else {
               // Y is dominant
               const expectedWidth = newHeightY * aspect
               localDx = (handle.includes('r') ? 1 : -1) * (expectedWidth - initial.width)
           }
        }

        let newWidth = initial.width
        let newHeight = initial.height
        let deltaXGlobal = 0
        let deltaYGlobal = 0

        if (handle.includes('r')) {
          newWidth += localDx
        }
        if (handle.includes('l')) {
          newWidth -= localDx
          deltaXGlobal += localDx * Math.cos(angle)
          deltaYGlobal += localDx * Math.sin(angle)
        }
        if (handle.includes('b')) {
          newHeight += localDy
        }
        if (handle.includes('t')) {
          newHeight -= localDy
          deltaXGlobal += -localDy * Math.sin(angle)
          deltaYGlobal += localDy * Math.cos(angle)
        }

        s.updateElement(el.id, { 
          x: initial.x + deltaXGlobal, 
          y: initial.y + deltaYGlobal, 
          width: newWidth, 
          height: newHeight 
        })
      }
      return
    }

    // Group resize
    if (isGroupResizing.current && groupResizeInitialBox.current && groupResizeHandle.current && groupResizeInitialElements.current) {
      const handle = groupResizeHandle.current
      if (canvasRef.current) {
        if (['tl', 'br'].includes(handle)) canvasRef.current.style.cursor = 'nwse-resize'
        else if (['tr', 'bl'].includes(handle)) canvasRef.current.style.cursor = 'nesw-resize'
        else if (['tm', 'bm'].includes(handle)) canvasRef.current.style.cursor = 'ns-resize'
        else if (['ml', 'mr'].includes(handle)) canvasRef.current.style.cursor = 'ew-resize'
      }

      const initial = groupResizeInitialBox.current
      const dx = canvasPoint.x - mouseStart.current.x
      const dy = canvasPoint.y - mouseStart.current.y

      let newWidth = initial.width
      let newHeight = initial.height
      let deltaX = 0
      let deltaY = 0

      if (handle.includes('r')) newWidth += dx
      if (handle.includes('l')) { newWidth -= dx; deltaX += dx }
      if (handle.includes('b')) newHeight += dy
      if (handle.includes('t')) { newHeight -= dy; deltaY += dy }

      const scaleX = initial.width > 0 ? newWidth / initial.width : 1
      const scaleY = initial.height > 0 ? newHeight / initial.height : 1

      groupResizeInitialElements.current.forEach(origEl => {
        const relX = origEl.x - initial.x
        const relY = origEl.y - initial.y
        s.updateElement(origEl.id, {
          x: initial.x + deltaX + relX * scaleX,
          y: initial.y + deltaY + relY * scaleY,
          width: origEl.width * scaleX,
          height: origEl.height * scaleY,
        })
      })
      return
    }

    // Drag seçilmiş elementlər
    if (isDragging.current && s.selectedIds.size > 0) {
      if (canvasRef.current) canvasRef.current.style.cursor = 'move'
      const dx = canvasPoint.x - lastMouse.current.x
      const dy = canvasPoint.y - lastMouse.current.y

      // İlkin olaraq köməkçi xətləri sıfırla
      showGuideXRef.current = false
      showGuideYRef.current = false

      // Viewport mərkəzini hesabla
      const parent = canvasRef.current?.parentElement
      const w = parent ? parent.clientWidth : window.innerWidth
      const h = parent ? parent.clientHeight : window.innerHeight
      const viewportCenterX = (w / 2 - s.appState.scrollX) / s.appState.zoom
      const viewportCenterY = (h / 2 - s.appState.scrollY) / s.appState.zoom

      // Hər seçilmiş elementi yenilə
      const threshold = 6 / s.appState.zoom

      // Qrup (çoxlu seçim) mərkəzləmə snap-i
      if (s.selectedIds.size > 1) {
        const groupBbox = getGroupBoundingBox(s.elements, s.selectedIds)
        if (groupBbox) {
          const groupCenterX = groupBbox.x + groupBbox.width / 2 + dx
          const groupCenterY = groupBbox.y + groupBbox.height / 2 + dy

          let snapX = 0
          let snapY = 0

          if (Math.abs(groupCenterY - viewportCenterY) < threshold) {
            snapY = viewportCenterY - (groupBbox.y + groupBbox.height / 2)
            showGuideYRef.current = true
            guideYCoordRef.current = viewportCenterY
          }

          if (Math.abs(groupCenterX - viewportCenterX) < threshold) {
            snapX = viewportCenterX - (groupBbox.x + groupBbox.width / 2)
            showGuideXRef.current = true
            guideXCoordRef.current = viewportCenterX
          }

          s.elements.forEach(el => {
            if (s.selectedIds.has(el.id)) {
              s.updateElement(el.id, { x: el.x + dx + snapX, y: el.y + dy + snapY })
            }
          })
        }
      } else {
        // Tək element snap-i
        s.elements.forEach(el => {
          if (s.selectedIds.has(el.id)) {
            let newX = el.x + dx
            let newY = el.y + dy

            const elCenterX = newX + el.width / 2
            const elCenterY = newY + el.height / 2

            if (Math.abs(elCenterY - viewportCenterY) < threshold) {
              newY = viewportCenterY - el.height / 2
              showGuideYRef.current = true
              guideYCoordRef.current = viewportCenterY
            }

            if (Math.abs(elCenterX - viewportCenterX) < threshold) {
              newX = viewportCenterX - el.width / 2
              showGuideXRef.current = true
              guideXCoordRef.current = viewportCenterX
            }

            s.updateElement(el.id, { x: newX, y: newY })
          }
        })
      }

      lastMouse.current = canvasPoint
      return
    }

    // Lasso
    if (lassoStart.current) {
      lassoEnd.current = canvasPoint

      // Lasso içindəki elementləri seç
      s.setElements(
        s.elements.map(el => el) // redraw trigger
      )
      return
    }

    // Aktiv çizim
    if (isDrawing.current && currentElId.current) {
      const el = s.elements.find(e => e.id === currentElId.current)
      if (!el) return

      const start = mouseStart.current
      const dx = canvasPoint.x - start.x
      const dy = canvasPoint.y - start.y

      // Shift: mütənasib ölçü
      const w = e.shiftKey && el.type !== 'line' && el.type !== 'arrow'
        ? Math.sign(dx) * Math.max(Math.abs(dx), Math.abs(dy))
        : dx
      const h = e.shiftKey && el.type !== 'line' && el.type !== 'arrow'
        ? Math.sign(dy) * Math.max(Math.abs(dx), Math.abs(dy))
        : dy

      if (el.type === 'line' || el.type === 'arrow') {
        s.updateElement(el.id, {
          points: [{ x: 0, y: 0 }, { x: dx, y: dy }],
          width:  Math.abs(dx),
          height: Math.abs(dy),
        })
      } else if (el.type === 'freedraw') {
        const newPoint: Point = {
          x: canvasPoint.x - el.x,
          y: canvasPoint.y - el.y,
        }
        const currentPoints = s.elements.find(e => e.id === currentElId.current)?.points ?? []
        s.updateElement(el.id, { points: [...currentPoints, newPoint] })
      } else {
        s.updateElement(el.id, { width: w, height: h })
      }
      return
    }

    // --- Cursor Updates on Hover ---
    if (!isDragging.current && !isDrawing.current && !resizingHandle.current && !rotatingElementId.current && !lassoStart.current && !isGroupRotating.current && !isGroupResizing.current) {
      if (s.activeTool === 'select' || s.activeTool === 'hand') {
        let hoverHandle: HandleType | null = null

        // Çoxlu seçimdə əvvəlcə qrup bounding box handle-larını yoxla
        if (s.selectedIds.size > 1) {
          const groupBbox = getGroupBoundingBox(s.elements, s.selectedIds)
          if (groupBbox) {
            const PAD = 8 / s.appState.zoom
            const virtualEl = {
              x: groupBbox.x - PAD, y: groupBbox.y - PAD,
              width: groupBbox.width + PAD * 2, height: groupBbox.height + PAD * 2,
              angle: 0, id: '', type: 'rectangle' as const,
              strokeColor: '', fillColor: '', fillStyle: 'solid' as any,
              strokeWidth: 0, strokeStyle: 'solid' as any,
              opacity: 100, roughness: 0, seed: 0, version: 1, isDeleted: false,
            }
            hoverHandle = getHandleAtPoint(virtualEl, canvasPoint, s.appState.zoom)
          }
        }

        // Tək element handle-larını yoxla (qrup handle-u tapılmadısa)
        if (!hoverHandle) {
          for (const elId of Array.from(s.selectedIds)) {
            const el = s.elements.find(e => e.id === elId)
            if (el) {
              hoverHandle = getHandleAtPoint(el, canvasPoint, s.appState.zoom)
              if (hoverHandle) break
            }
          }
        }

        if (canvasRef.current) {
          if (hoverHandle) {
            if (hoverHandle === 'rotate') canvasRef.current.style.cursor = 'grab'
            else if (['tl', 'br'].includes(hoverHandle)) canvasRef.current.style.cursor = 'nwse-resize'
            else if (['tr', 'bl'].includes(hoverHandle)) canvasRef.current.style.cursor = 'nesw-resize'
            else if (['tm', 'bm'].includes(hoverHandle)) canvasRef.current.style.cursor = 'ns-resize'
            else if (['ml', 'mr'].includes(hoverHandle)) canvasRef.current.style.cursor = 'ew-resize'
          } else if (s.activeTool === 'hand') {
            canvasRef.current.style.cursor = 'grab'
          } else {
             const hoverElement = getElementAtPoint(s.elements, canvasPoint, s.appState.zoom)
             if (hoverElement && s.selectedIds.has(hoverElement.id)) {
                 canvasRef.current.style.cursor = 'move'
             } else {
                 canvasRef.current.style.cursor = 'crosshair'
             }
          }
        }
      } else if (s.activeTool !== 'eraser') {
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'crosshair'
        }
      }
    }
  }, [toCanvas, canvasRef])

  // ── Mouse Up ─────────────────────────────────────────────────────────────
  const handleMouseUp = useCallback(() => {
    const s = useCanvasStore.getState()
    // Lasso seçimi tamamla
    if (lassoStart.current && lassoEnd.current) {
      const inRect = getElementsInRect(
        s.elements,
        lassoStart.current,
        lassoEnd.current
      )

      if (inRect.length > 0) {
        s.selectElements(inRect.map(el => el.id))
      }

      lassoStart.current = null
      lassoEnd.current   = null
    }

    // Boş element-ləri sil (çizilməmiş)
    if (isDrawing.current && currentElId.current) {
      const el = s.elements.find(e => e.id === currentElId.current)
      if (el) {
        const isEmpty =
          (el.type !== 'freedraw' && Math.abs(el.width) < 2 && Math.abs(el.height) < 2) ||
          (el.type === 'text' && !el.text?.trim())

        if (isEmpty && el.type !== 'text') {
          s.deleteElements([el.id])
        }

        // Bir kliklə shape: default ölçü ver
        if (Math.abs(el.width) < 4 && Math.abs(el.height) < 4 &&
            el.type !== 'freedraw' && el.type !== 'line' && el.type !== 'arrow') {
          s.updateElement(el.id, { width: 100, height: 100 })
        }
      }
    }

    isDrawing.current  = false
    isPanning.current  = false
    isDragging.current = false
    resizingHandle.current = null
    rotatingElementId.current = null
    currentElId.current = null
    isGroupRotating.current = false
    isGroupResizing.current = false
    groupResizeHandle.current = null
    groupResizeInitialBox.current = null
    groupResizeInitialElements.current = null

    // Köməkçi xətləri sıfırla
    showGuideXRef.current = false
    showGuideYRef.current = false
  }, [])

  // ── Mouse Wheel (zoom) ───────────────────────────────────────────────────
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const s = useCanvasStore.getState()
    const { zoom, scrollX, scrollY } = s.appState

    if (e.ctrlKey || e.metaKey) {
      // Zoom — mouse mərkəzinə görə
      const zoomDelta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP
      const newZoom   = Math.min(Math.max(zoom + zoomDelta * zoom, ZOOM_MIN), ZOOM_MAX)
      const ratio     = newZoom / zoom

      s.setZoom(newZoom)
      s.setScroll(
        e.clientX - (e.clientX - scrollX) * ratio,
        e.clientY - (e.clientY - scrollY) * ratio
      )
    } else {
      // Scroll / pan
      s.setScroll(
        scrollX - e.deltaX,
        scrollY - e.deltaY
      )
    }
  }, [])

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // həmişə taze state oxu — storeRef köhnə snapshot ola bilər
      const s = useCanvasStore.getState()

      // Text edit modunda — heç bir shortcut işləməsin
      if (s.editingId) return

      // Ctrl+S — manual save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('flaro:save'))
        return
      }

      if (e.code === 'Space') {
        spaceDown.current = true
        e.preventDefault()
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (s.canUndo()) s.undo()
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        if (s.canRedo()) s.redo()
      }

      // Select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault()
        s.selectAll()
      }

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (s.selectedIds.size > 0) {
          s.saveHistory()
          s.deleteElements(Array.from(s.selectedIds))
        }
      }

      // Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        if (s.selectedIds.size > 0) {
          s.saveHistory()
          s.duplicateElements(Array.from(s.selectedIds))
        }
      }

      // Escape — seçimi ləğv et
      if (e.key === 'Escape') {
        s.clearSelection()
        s.setEditingId(null)
      }

      // Tool shortcuts — yalnız modifier olmadıqda
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const TOOL_KEYS: Record<string, ToolType> = {
          'v': 'select', 'h': 'hand',   'r': 'rectangle',
          'o': 'ellipse', 'd': 'diamond', 'l': 'line',
          'a': 'arrow',   't': 'text',    'p': 'freedraw',
          'e': 'eraser',
        }
        const tool = TOOL_KEYS[e.key.toLowerCase()]
        if (tool) s.setTool(tool)
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') spaceDown.current = false
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup',   onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup',   onKeyUp)
    }
  }, [])  // dependency yoxdur — getState() həmişə aktual dəyər verir


  // ── Touch Events ─────────────────────────────────────────────────────────
  const touchToMouse = (touch: Touch): MouseEvent => {
    return {
      clientX: touch.clientX,
      clientY: touch.clientY,
      button: 0,
      shiftKey: false,
      metaKey: false,
      ctrlKey: false,
    } as unknown as MouseEvent
  }

  const isTouch = useRef(false)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    isTouch.current = true
    // Tək toxunuşda preventDefault etmirik ki, mobil klaviatura açıla bilsin
    if (e.touches.length > 1) {
      e.preventDefault()
    }
    if (e.touches.length === 1) {
      handleMouseDown(touchToMouse(e.touches[0]!))
    }
  }, [handleMouseDown])

  const pinchDistRef = useRef<number | null>(null)

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 1) {
      handleMouseMove(touchToMouse(e.touches[0]!))
    }
    // İki barmaq — pinch zoom:
    if (e.touches.length === 2) {
      const t1 = e.touches[0]!
      const t2 = e.touches[1]!
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
      
      if (pinchDistRef.current !== null) {
        const delta = dist - pinchDistRef.current
        const s = storeRef.current
        const { zoom, scrollX, scrollY } = s.appState
        const zoomDelta = delta * 0.01
        const newZoom = Math.min(Math.max(zoom + zoomDelta * zoom, ZOOM_MIN), ZOOM_MAX)
        const ratio = newZoom / zoom

        const centerX = (t1.clientX + t2.clientX) / 2
        const centerY = (t1.clientY + t2.clientY) / 2

        s.setZoom(newZoom)
        s.setScroll(
          centerX - (centerX - scrollX) * ratio,
          centerY - (centerY - scrollY) * ratio
        )
      }
      pinchDistRef.current = dist
    }
  }, [handleMouseMove])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (e.touches.length >= 2) {
      e.preventDefault()
    }
    if (e.touches.length < 2) {
      pinchDistRef.current = null
    }
    handleMouseUp()
  }, [handleMouseUp])

  const handleDoubleClick = useCallback((e: MouseEvent) => {
    const s = useCanvasStore.getState()
    const canvasPoint = toCanvas(e.clientX, e.clientY)
    const hit = getElementAtPoint(s.elements, canvasPoint, s.appState.zoom)
    if (hit && hit.type === 'text') {
      s.saveHistory()
      s.setEditingId(hit.id)
      s.selectElement(hit.id)
    }
  }, [toCanvas])

  // ── Render loop ───────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')!
    const rc  = rough.canvas(canvas)

    const render = () => {
      const { elements, selectedIds, appState } = useCanvasStore.getState()
      const { zoom, scrollX, scrollY, backgroundColor, gridEnabled, gridSize } = appState

      // Canvas boyutunu yenilə (çökmə/kiçilmə probleminin qarşısını almaq üçün parent-dən oxunur)
      const parent = canvas.parentElement
      const w = parent ? parent.clientWidth : window.innerWidth
      const h = parent ? parent.clientHeight : window.innerHeight
      canvas.width  = w || window.innerWidth
      canvas.height = h || window.innerHeight

      // Arxa plan
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Grid
      if (gridEnabled) drawGrid(ctx, zoom, scrollX, scrollY, gridSize)

      // Transform
      ctx.save()
      ctx.translate(scrollX, scrollY)
      ctx.scale(zoom, zoom)

      // Elementlər
      elements
        .filter(el => !el.isDeleted)
        .forEach(el => {
          drawRoughElement(rc, ctx, el)

          if (selectedIds.has(el.id)) {
            drawSelectionBox(ctx, el, zoom)
          }
        })

      // Qrup seçim qutusu (çoxlu seçimdə)
      if (selectedIds.size > 1) {
        drawGroupSelectionBox(ctx, elements, selectedIds, zoom)
      }

      // Lasso
      if (lassoStart.current && lassoEnd.current) {
        drawLasso(ctx, lassoStart.current, lassoEnd.current, zoom)
      }

      ctx.restore()

      // Mərkəzləmə köməkçi ox xətlərini çək (premium Orange-500 rəngində)
      if (showGuideXRef.current || showGuideYRef.current) {
        ctx.save()
        ctx.strokeStyle = '#f97316'
        ctx.lineWidth = 1.5
        ctx.setLineDash([6, 4])
        
        // Şaquli ox (Vertical Center Guide)
        if (showGuideXRef.current) {
          const screenX = guideXCoordRef.current * zoom + scrollX
          ctx.beginPath()
          ctx.moveTo(screenX, 0)
          ctx.lineTo(screenX, canvas.height)
          ctx.stroke()
        }

        // Üfüqi ox (Horizontal Center Guide)
        if (showGuideYRef.current) {
          const screenY = guideYCoordRef.current * zoom + scrollY
          ctx.beginPath()
          ctx.moveTo(0, screenY)
          ctx.lineTo(canvas.width, screenY)
          ctx.stroke()
        }

        ctx.restore()
      }

      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)

    return () => cancelAnimationFrame(rafRef.current)
  }, [canvasRef.current])

  // ── Event listener-lər ───────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onMouseDown = (e: MouseEvent) => {
      if (isTouch.current) return // touch-un yaratdığı saxta mouse event-i blokla
      handleMouseDown(e)
    }
    const onMouseMove = (e: MouseEvent) => {
      if (isTouch.current) return
      handleMouseMove(e)
    }
    const onMouseUp = () => {
      if (isTouch.current) {
        // toxunuş bitdikdən bir az sonra isTouch-u sıfırla ki, növbəti əsl mouse event-lər işləsin
        setTimeout(() => { isTouch.current = false }, 100)
        return
      }
      handleMouseUp()
    }

    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseup',   onMouseUp)
    canvas.addEventListener('wheel',     handleWheel, { passive: false })
    canvas.addEventListener('dblclick',  handleDoubleClick)
    
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove',  handleTouchMove,  { passive: false })
    canvas.addEventListener('touchend',   handleTouchEnd,   { passive: false })

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseup',   onMouseUp)
      canvas.removeEventListener('wheel',     handleWheel)
      canvas.removeEventListener('dblclick',  handleDoubleClick)

      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove',  handleTouchMove)
      canvas.removeEventListener('touchend',   handleTouchEnd)
    }
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleWheel, handleDoubleClick, handleTouchStart, handleTouchMove, handleTouchEnd, canvasRef.current])

  // ── Eraser dairəvi kursoru ────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (store.activeTool === 'eraser') {
      const size = 20
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>
        <circle cx='${size / 2}' cy='${size / 2}' r='${size / 2 - 1}'
          fill='rgba(255,255,255,0.8)' stroke='#666' stroke-width='1.5'/>
      </svg>`
      canvas.style.cursor = `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${size / 2} ${size / 2}, crosshair`
    } else if (store.activeTool === 'hand') {
      canvas.style.cursor = 'grab'
    } else {
      canvas.style.cursor = 'crosshair'
    }
  }, [store.activeTool, canvasRef])

  return { toCanvas, toScreen }
}

// ── Grid çizimi ───────────────────────────────────────────────────────────────

function drawGrid(
  ctx:     CanvasRenderingContext2D,
  zoom:    number,
  scrollX: number,
  scrollY: number,
  size:    number
): void {
  const W = ctx.canvas.width
  const H = ctx.canvas.height

  const gridSize = size * zoom
  const offsetX  = ((scrollX % gridSize) + gridSize) % gridSize
  const offsetY  = ((scrollY % gridSize) + gridSize) % gridSize

  ctx.save()
  ctx.strokeStyle = 'rgba(0,0,0,0.06)'
  ctx.lineWidth   = 1

  for (let x = offsetX; x < W; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, H)
    ctx.stroke()
  }

  for (let y = offsetY; y < H; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(W, y)
    ctx.stroke()
  }

  ctx.restore()
}
